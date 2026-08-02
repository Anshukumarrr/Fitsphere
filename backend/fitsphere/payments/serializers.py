from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source="member.user.get_full_name", read_only=True
    )
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Payment
        fields = (
            "id",
            "member",
            "member_name",
            "branch",
            "branch_name",
            "payment_type",
            "payment_method",
            "status",
            "due_date",
            "amount",
            "invoice_number",
            "description",
            "reference_id",
            "gateway",
            "gateway_order_id",
            "gateway_payment_id",
            "gateway_signature",
            "received_by",
            "paid_at",
            "created_at",
            "updated_at",
            "organization",
        )
        read_only_fields = (
            "id",
            "invoice_number",
            "received_by",
            "paid_at",
            "created_at",
            "updated_at",
            "organization",
            "gateway",
            "gateway_order_id",
            "gateway_payment_id",
            "gateway_signature",
        )


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "member",
            "branch",
            "payment_type",
            "payment_method",
            "status",
            "due_date",
            "amount",
            "description",
            "reference_id",
        )

    def create(self, validated_data):
        validated_data["received_by"] = self.context["request"].user
        validated_data["organization"] = self.context["request"].user.organization
        payment = super().create(validated_data)
        self._sync_membership(payment)
        return payment

    def _sync_membership(self, payment):
        """Close the cash/manual-payment gap: a completed membership/renewal
        payment must leave an active MemberMembership row so the expiry
        scheduler can fire emails for that member.

        Mirrors razorpay_views._fulfil create path (incl. amount_paid) but
        without a plan: end_date falls back to due_date, then today + 30 days
        (same default the Payment.save pending-payment rule uses). Never
        touches an existing active row — extending dates without knowing the
        plan duration could shorten a membership.
        """
        from datetime import date, timedelta

        from ..memberships.models import MemberMembership

        if payment.status != Payment.PaymentStatus.COMPLETED:
            return
        if payment.payment_type not in (
            Payment.PaymentType.MEMBERSHIP,
            Payment.PaymentType.RENEWAL,
        ):
            return
        member = payment.member
        if MemberMembership.objects.filter(member=member, is_active=True).exists():
            return
        end_date = payment.due_date or (date.today() + timedelta(days=30))
        MemberMembership.objects.create(
            member=member,
            organization=payment.organization,
            plan=None,
            start_date=date.today(),
            end_date=end_date,
            is_active=True,
            amount_paid=payment.amount,
        )
        member.membership_end_date = end_date
        member.save(update_fields=["membership_end_date"])
