"""Tests for the gym public-profile feature (Cloudinary-backed).

Covers the public storefront listing, the owner/receptionist edit gate on
GymProfileView, and image upload. Cloudinary is mocked so these run with no
credentials and never hit the live network.
"""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from fitsphere.organizations.models import GymOrganization

User = get_user_model()


def _png_bytes():
    # Minimal valid 1x1 PNG.
    return (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf"
        b"\xc0\x00\x00\x00\x03\x00\x01\x87\xbd\xc5\xe1\x00\x00\x00\x00IEND\xaeB"
        b"`\x82"
    )


def _image(name="b.png"):
    return SimpleUploadedFile(name, _png_bytes(), content_type="image/png")


class GymProfileAPITests(APITestCase):
    def setUp(self):
        self.org = GymOrganization.objects.create(name="Verity Gym", slug="verity-gym")
        self.owner = User.objects.create_user(
            username="verity-owner", email="vo@a.com", password="x",
            role="gym_owner", organization=self.org,
        )
        self.receptionist = User.objects.create_user(
            username="verity-recep", email="vr@a.com", password="x",
            role="receptionist", organization=self.org,
        )
        self.trainer = User.objects.create_user(
            username="verity-trainer", email="vt@a.com", password="x",
            role="trainer", organization=self.org,
        )
        self.member_user = User.objects.create_user(
            username="verity-member", email="vm@a.com", password="x",
            role="member", organization=self.org,
        )

    def test_public_list_is_allow_any_and_shapes_ok(self):
        resp = self.client.get("/api/v1/organizations/public/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        row = resp.data[0]
        self.assertEqual(row["name"], "Verity Gym")
        self.assertIn("banner_image_url", row)
        self.assertIn("picture_image_url", row)

    def test_public_list_excludes_inactive(self):
        self.org.is_active = False
        self.org.save()
        resp = self.client.get("/api/v1/organizations/public/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 0)

    def test_profile_get_requires_auth(self):
        resp = self.client.get("/api/v1/organizations/profile/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_patches_text_only(self):
        self.client.force_authenticate(self.owner)
        resp = self.client.patch(
            "/api/v1/organizations/profile/",
            {"owner_name": "Anshu", "description": "A clean gym"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.org.refresh_from_db()
        self.assertEqual(self.org.owner_name, "Anshu")
        self.assertEqual(self.org.description, "A clean gym")

    def test_receptionist_patches(self):
        self.client.force_authenticate(self.receptionist)
        resp = self.client.patch(
            "/api/v1/organizations/profile/",
            {"description": "Edited by reception"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_trainer_cannot_patch(self):
        self.client.force_authenticate(self.trainer)
        resp = self.client.patch(
            "/api/v1/organizations/profile/",
            {"owner_name": "nope"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_cannot_patch(self):
        self.client.force_authenticate(self.member_user)
        resp = self.client.patch(
            "/api/v1/organizations/profile/",
            {"owner_name": "nope"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    @patch("fitsphere.organizations.cloudinary_utils.cloudinary.uploader.upload")
    def test_upload_banner_and_picture(self, mock_upload):
        mock_upload.side_effect = [
            {"public_id": "gym_banners/verity-banner"},
            {"public_id": "gym_avatars/verity-avatar"},
        ]
        self.client.force_authenticate(self.owner)
        resp = self.client.patch(
            "/api/v1/organizations/profile/",
            {
                "banner_image": _image("banner.png"),
                "profile_image": _image("avatar.png"),
                "owner_name": "Anshu",
            },
            format="multipart",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.org.refresh_from_db()
        self.assertEqual(self.org.banner_public_id, "gym_banners/verity-banner")
        self.assertEqual(self.org.picture_public_id, "gym_avatars/verity-avatar")

    def test_non_image_upload_rejected(self):
        self.client.force_authenticate(self.owner)
        resp = self.client.patch(
            "/api/v1/organizations/profile/",
            {"banner_image": SimpleUploadedFile("b.txt", b"plain text", content_type="text/plain")},
            format="multipart",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)