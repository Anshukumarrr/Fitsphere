"""C5 regression tests: QR check-in must be staff-only and tenant-scoped."""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from ..organizations.models import GymOrganization, Branch
from ..members.models import Member
from .models import QRCode


class QRCheckInTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.org_a = GymOrganization.objects.create(name="Gym A", slug="gym-a")
        self.org_b = GymOrganization.objects.create(name="Gym B", slug="gym-b")
        self.branch_a = Branch.objects.create(organization=self.org_a, name="A Main")
        self.branch_b = Branch.objects.create(organization=self.org_b, name="B Main")
        self.qr_a = QRCode.objects.create(branch=self.branch_a, is_active=True)
        self.qr_b = QRCode.objects.create(branch=self.branch_b, is_active=True)

        self.owner_a = User.objects.create_user(
            username="owner_a", password="pass", organization=self.org_a,
            role="gym_owner", email="a@a.com",
        )
        self.member_a = Member.objects.create(
            user=User.objects.create_user(
                username="member_a", password="pass", organization=self.org_a,
                role="member", email="m@a.com",
            ),
            organization=self.org_a, branch=self.branch_a,
        )
        self.member_b = Member.objects.create(
            user=User.objects.create_user(
                username="member_b", password="pass", organization=self.org_b,
                role="member", email="m@b.com",
            ),
            organization=self.org_b, branch=self.branch_b,
        )
        self.client = APIClient()

    def _post(self, user, qr, member_id):
        self.client.force_authenticate(user=user)
        return self.client.post(
            "/api/v1/attendance/check-in/qr/",
            {"qr_code": str(qr.code), "member_id": member_id},
            format="json",
        )

    def test_member_role_cannot_check_in_via_qr(self):
        resp = self._post(self.member_a.user, self.qr_a, self.member_a.id)
        self.assertEqual(resp.status_code, 403)

    def test_staff_can_check_in_own_tenant_member(self):
        resp = self._post(self.owner_a, self.qr_a, self.member_a.id)
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data["organization"], self.org_a.id)
        self.assertEqual(resp.data["branch"], self.branch_a.id)

    def test_cross_tenant_member_rejected(self):
        # owner of gym A scanning gym A's QR with gym B's member id
        resp = self._post(self.owner_a, self.qr_a, self.member_b.id)
        self.assertEqual(resp.status_code, 404)

    def test_other_tenant_qr_rejected_for_own_member(self):
        # owner of gym A scanning gym B's QR with gym A's member id
        resp = self._post(self.owner_a, self.qr_b, self.member_a.id)
        self.assertEqual(resp.status_code, 404)
