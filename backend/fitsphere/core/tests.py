"""C3 regression test: organization is read-only on the user serializer,
so a user cannot PATCH /auth/me/ to switch tenants."""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from ..organizations.models import GymOrganization
from ..core.serializers import UserSerializer


class TenantSwitchTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.org_a = GymOrganization.objects.create(name="Gym A", slug="gym-a")
        self.org_b = GymOrganization.objects.create(name="Gym B", slug="gym-b")
        self.user = User.objects.create_user(
            username="owner1", password="pass", organization=self.org_a,
            role="gym_owner", email="o@a.com",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_organization_in_read_only_fields(self):
        self.assertIn("organization", UserSerializer.Meta.read_only_fields)

    def test_patch_me_cannot_switch_organization(self):
        resp = self.client.patch(
            "/api/v1/auth/me/",
            {"organization": self.org_b.id},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.organization_id, self.org_a.id)
        self.assertEqual(resp.data["organization"], self.org_a.id)

    def test_serializer_ignores_organization_on_input(self):
        # organization must not be writable via the serializer: providing it
        # as input must not raise a field error but must also never be saved.
        ser = UserSerializer(
            instance=self.user,
            data={"organization": self.org_b.id, "first_name": "Zed"},
            partial=True,
        )
        self.assertTrue(ser.is_valid(), ser.errors)
        self.assertNotIn("organization", ser.validated_data)
