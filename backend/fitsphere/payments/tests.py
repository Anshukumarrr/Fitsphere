from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from ..memberships.models import MembershipPlan, MemberMembership
from .models import Payment


class RazorpayTests(TestCase):
    def setUp(self):
        from ..organizations.models import GymOrganization
        from ..members.models import Member
        from django.contrib.auth import get_user_model

        User = get_user_model()
        self.org = GymOrganization.objects.create(name="Test Gym", slug="test")
        self.user = User.objects.create_user(
            username="member1", password="pass", organization=self.org,
            role="member", email="m@t.com",
        )
        self.member = Member.objects.create(
            user=self.user, organization=self.org,
        )
        self.plan = MembershipPlan.objects.create(
            organization=self.org, name="Monthly", price="1000",
            duration_days=30, is_active=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    @patch("razorpay.Client")
    def test_cross_org_plan_rejected(self, mock_rzp):
        other_org = type(self.org).objects.create(name="Other", slug="other")
        other_plan = MembershipPlan.objects.create(
            organization=other_org, name="Other Plan", price="500",
            duration_days=15, is_active=True,
        )
        resp = self.client.post("/api/v1/payments/razorpay/create-order/", {
            "purchase_type": "membership_plan", "item_id": other_plan.id,
        })
        self.assertEqual(resp.status_code, 404)

    @patch("razorpay.Client")
    def test_other_member_payment_rejected(self, mock_rzp):
        from django.contrib.auth import get_user_model
        from ..members.models import Member
        User = get_user_model()
        other_user = User.objects.create_user(
            username="other", password="pass", organization=self.org,
            role="member", email="o@t.com",
        )
        other_member = Member.objects.create(
            user=other_user, organization=self.org,
        )
        other_payment = Payment.objects.create(
            member=other_member, organization=self.org, amount=500,
            status="pending", gateway="razorpay",
            gateway_order_id="order_other",
            branch=None, payment_type="membership",
        )
        resp = self.client.post("/api/v1/payments/razorpay/verify/", {
            "payment_id": other_payment.id,
            "razorpay_order_id": "order_other",
            "razorpay_payment_id": "pay_other",
            "razorpay_signature": "sig_other",
        })
        self.assertEqual(resp.status_code, 404)

    @patch("razorpay.Client")
    def test_bad_signature_rejected(self, mock_rzp):
        mock_rzp.return_value.utility.verify_payment_signature.side_effect = (
            __import__("razorpay").errors.SignatureVerificationError("bad sig")
        )
        payment = Payment.objects.create(
            member=self.member, organization=self.org, amount=1000,
            status="pending", gateway="razorpay",
            gateway_order_id="order_test",
            branch=None, payment_type="membership",
        )
        resp = self.client.post("/api/v1/payments/razorpay/verify/", {
            "payment_id": payment.id,
            "razorpay_order_id": "order_test",
            "razorpay_payment_id": "pay_test",
            "razorpay_signature": "bad",
        })
        self.assertEqual(resp.status_code, 400)
        payment.refresh_from_db()
        self.assertEqual(payment.status, "pending")

    @patch("razorpay.Client")
    def test_extend_membership_not_stack(self, mock_rzp):
        mock_rzp.return_value.utility.verify_payment_signature.return_value = None
        mock_rzp.return_value.order.create.return_value = {"id": "ord_fake", "amount": 100000, "currency": "INR"}
        from datetime import date, timedelta
        start = date.today() - timedelta(days=30)
        existing = MemberMembership.objects.create(
            member=self.member, plan=self.plan, organization=self.org,
            start_date=start, end_date=date.today(), is_active=True,
            amount_paid=1000,
        )
        payment = Payment.objects.create(
            member=self.member, organization=self.org, amount=1000,
            status="pending", gateway="razorpay",
            gateway_order_id="ord_ext", reference_id=f"membership_plan:{self.plan.id}",
            branch=None, payment_type="membership",
        )
        resp = self.client.post("/api/v1/payments/razorpay/verify/", {
            "payment_id": payment.id,
            "razorpay_order_id": "ord_ext",
            "razorpay_payment_id": "pay_ext",
            "razorpay_signature": "sig_ext",
        })
        self.assertEqual(resp.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, "completed")
        existing.refresh_from_db()
        expected_end = date.fromordinal(date.today().toordinal() + self.plan.duration_days)
        self.assertEqual(existing.end_date, expected_end)
        self.assertEqual(MemberMembership.objects.filter(member=self.member).count(), 1)
