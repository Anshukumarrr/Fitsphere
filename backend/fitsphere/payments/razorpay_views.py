from datetime import date, timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..core.permissions import IsMember
from ..memberships.models import MemberMembership, MembershipPlan, MembershipRenewal
from ..personal_training.models import PTPackage, PTMembership
from .models import Payment
from .serializers import PaymentSerializer


class CreateOrderSerializer(serializers.Serializer):
    purchase_type = serializers.ChoiceField(choices=["membership_plan", "pt_package", "renewal"])
    item_id = serializers.IntegerField()
    plan_id = serializers.IntegerField(required=False)


class VerifyPaymentSerializer(serializers.Serializer):
    payment_id = serializers.IntegerField()
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()


class CreateOrderView(APIView):
    permission_classes = (IsMember,)

    def post(self, request):
        ser = CreateOrderSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        purchase_type = ser.validated_data["purchase_type"]
        item_id = ser.validated_data["item_id"]

        member = getattr(request.user, "member_profile", None)
        if not member:
            return Response({"detail": "Member profile not found."}, status=status.HTTP_400_BAD_REQUEST)

        org = request.user.organization
        if purchase_type == "membership_plan":
            try:
                plan = MembershipPlan.objects.get(id=item_id, organization=org, is_active=True)
            except MembershipPlan.DoesNotExist:
                return Response({"detail": "Plan not found."}, status=status.HTTP_404_NOT_FOUND)
            amount = plan.price
        elif purchase_type == "renewal":
            try:
                membership = MemberMembership.objects.get(id=item_id, member=member, organization=org)
            except MemberMembership.DoesNotExist:
                return Response({"detail": "Membership not found."}, status=status.HTTP_404_NOT_FOUND)
            plan_id_in = ser.validated_data.get("plan_id") or membership.plan_id
            try:
                plan = MembershipPlan.objects.get(id=plan_id_in, organization=org, is_active=True)
            except MembershipPlan.DoesNotExist:
                return Response({"detail": "Plan not found."}, status=status.HTTP_404_NOT_FOUND)
            amount = plan.price
        else:
            try:
                package = PTPackage.objects.get(id=item_id, organization=org, is_active=True)
            except PTPackage.DoesNotExist:
                return Response({"detail": "Package not found."}, status=status.HTTP_404_NOT_FOUND)
            amount = package.price

        amount_paise = int(amount * 100)
        if amount_paise < 100:
            return Response({"detail": "Amount must be at least ₹1."}, status=status.HTTP_400_BAD_REQUEST)

        payment = Payment.objects.create(
            member=member,
            branch=member.branch,
            organization=org,
            payment_type="renewal" if purchase_type == "renewal" else ("membership" if purchase_type == "membership_plan" else "pt_package"),
            payment_method="online",
            status="pending",
            amount=amount,
            description=f"{purchase_type} purchase",
            reference_id=f"{purchase_type}:{item_id}",
            gateway="razorpay",
        )

        import razorpay
        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            order = client.order.create({"amount": amount_paise, "currency": "INR", "receipt": str(payment.id)})
        except Exception as e:
            payment.status = "failed"
            payment.save(update_fields=["status"])
            return Response({"detail": f"Razorpay error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        payment.gateway_order_id = order["id"]
        payment.save(update_fields=["gateway_order_id"])

        return Response({
            "order_id": order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key": settings.RAZORPAY_KEY_ID,
            "payment_id": payment.id,
        })


class VerifyPaymentView(APIView):
    permission_classes = (IsMember,)

    def post(self, request):
        ser = VerifyPaymentSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        payment_id = ser.validated_data["payment_id"]
        submitted_order_id = ser.validated_data["razorpay_order_id"]

        member = getattr(request.user, "member_profile", None)
        if not member:
            return Response({"detail": "Member profile not found."}, status=status.HTTP_400_BAD_REQUEST)

        # C1: payment must exist and belong to this member.
        try:
            payment = Payment.objects.get(id=payment_id, member=member)
        except Payment.DoesNotExist:
            return Response({"detail": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)

        # C1: the submitted order must be the order created for THIS payment.
        # A valid signature only proves the (order_id, payment_id) pair is
        # genuine — it does not prove that order belongs to this Payment row.
        if payment.gateway_order_id != submitted_order_id:
            return Response({"detail": "Order mismatch."}, status=status.HTTP_400_BAD_REQUEST)

        import razorpay
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        params = {
            "razorpay_order_id": submitted_order_id,
            "razorpay_payment_id": ser.validated_data["razorpay_payment_id"],
            "razorpay_signature": ser.validated_data["razorpay_signature"],
        }
        try:
            client.utility.verify_payment_signature(params)
        except razorpay.errors.SignatureVerificationError:
            return Response({"detail": "Signature verification failed."}, status=status.HTTP_400_BAD_REQUEST)

        # C1: confirm with Razorpay that this order was created for this
        # payment (receipt) and that the paid amount matches.
        try:
            order = client.order.fetch(submitted_order_id)
        except Exception:
            return Response({"detail": "Could not verify order."}, status=status.HTTP_400_BAD_REQUEST)
        expected_paise = int(payment.amount * 100)
        if str(order.get("receipt")) != str(payment.id):
            return Response({"detail": "Order receipt mismatch."}, status=status.HTTP_400_BAD_REQUEST)
        if int(order.get("amount", 0)) != expected_paise:
            return Response({"detail": "Amount mismatch."}, status=status.HTTP_400_BAD_REQUEST)
        if int(order.get("amount_paid", 0)) < expected_paise:
            return Response({"detail": "Order not fully paid."}, status=status.HTTP_400_BAD_REQUEST)

        # C2: lock the row and re-check status inside the transaction so two
        # concurrent verify calls can't both pass the pending check and both
        # fulfil (double credit / double membership extension).
        with transaction.atomic():
            payment = Payment.objects.select_for_update().get(id=payment_id)
            if payment.status != "pending":
                return Response({"detail": "Payment already processed."}, status=status.HTTP_400_BAD_REQUEST)
            payment.status = "completed"
            payment.payment_method = "online"
            payment.gateway_payment_id = ser.validated_data["razorpay_payment_id"]
            payment.gateway_signature = ser.validated_data["razorpay_signature"]
            payment.paid_at = timezone.now()
            payment.save()

            self._fulfil(payment, member)

        return Response(PaymentSerializer(payment).data)

    def _fulfil(self, payment, member):
        if not payment.reference_id:
            return
        parts = payment.reference_id.split(":", 1)
        if len(parts) != 2:
            return
        purchase_type, item_id_str = parts
        item_id = int(item_id_str)

        if purchase_type == "membership_plan":
            plan = MembershipPlan.objects.filter(id=item_id, organization=payment.organization_id, is_active=True).first()
            if not plan:
                return
            today = date.today()
            active = MemberMembership.objects.filter(member=member, is_active=True).order_by("-end_date").first()
            if active:
                prev_end = active.end_date
                active.end_date = date.fromordinal(active.end_date.toordinal() + plan.duration_days)
                active.amount_paid += payment.amount
                active.save(update_fields=["end_date", "amount_paid"])
                MembershipRenewal.objects.create(
                    member_membership=active, previous_end_date=prev_end,
                    new_end_date=active.end_date, amount_charged=payment.amount,
                    renewed_by=payment.received_by,
                )
            else:
                MemberMembership.objects.create(
                    member=member, plan=plan, organization=payment.organization_id,
                    start_date=today, end_date=date.fromordinal(today.toordinal() + plan.duration_days),
                    is_active=True, amount_paid=payment.amount,
                )
        elif purchase_type == "renewal":
            membership = MemberMembership.objects.filter(id=item_id, member=member).first()
            if not membership:
                return
            plan = MembershipPlan.objects.filter(id=membership.plan_id, organization=payment.organization_id, is_active=True).first()
            if not plan:
                return
            prev_end = membership.end_date
            membership.end_date = date.fromordinal(membership.end_date.toordinal() + plan.duration_days)
            membership.amount_paid += payment.amount
            membership.is_active = True
            membership.save(update_fields=["end_date", "amount_paid", "is_active"])
            MembershipRenewal.objects.create(
                member_membership=membership, previous_end_date=prev_end,
                new_end_date=membership.end_date, amount_charged=payment.amount,
                renewed_by=payment.received_by,
            )
        elif purchase_type == "pt_package":
            package = PTPackage.objects.filter(id=item_id, organization=payment.organization_id, is_active=True).first()
            if not package:
                return
            today = date.today()
            PTMembership.objects.create(
                member=member, package=package, organization=payment.organization_id,
                sessions_total=package.number_of_sessions, sessions_used=0,
                sessions_remaining=package.number_of_sessions,
                start_date=today, end_date=today + timedelta(days=package.validity_days),
                amount_paid=payment.amount, is_active=True,
            )
