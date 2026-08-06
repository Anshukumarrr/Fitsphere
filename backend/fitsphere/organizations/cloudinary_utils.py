"""Cloudinary helpers for gym public-profile images.

Images are uploaded server-side (keeping the role gate on the Django view and
the API secret out of the client) and stored as Cloudinary public_ids on the
GymOrganization model. Delivery URLs are built on read with optimized
format/quality and appropriate crops for the banner vs. circular avatar.
"""
from django.conf import settings
from rest_framework import serializers

import cloudinary
import cloudinary.utils
import cloudinary.uploader

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


def _configure():
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload_image(uploaded_file, folder="gym_profiles"):
    """Upload an UploadedFile to Cloudinary and return its public_id."""
    _configure()

    if uploaded_file.size > MAX_IMAGE_BYTES:
        raise serializers.ValidationError("Image is too large (max 5 MB).")
    content_type = getattr(uploaded_file, "content_type", "") or ""
    if content_type and not content_type.startswith("image/"):
        raise serializers.ValidationError("Uploaded file must be an image.")

    try:
        result = cloudinary.uploader.upload(
            uploaded_file.file if hasattr(uploaded_file, "file") else uploaded_file,
            folder=folder,
            overwrite=True,
        )
    except serializers.ValidationError:
        raise
    except Exception as exc:  # Cloudinary API / auth errors
        raise serializers.ValidationError(f"Image upload failed: {exc}") from exc
    return result["public_id"]


def delivery_url(public_id, *, width=None, height=None, crop="limit", gravity=None):
    """Return an optimized Cloudinary URL for a public_id, or "" when empty."""
    if not public_id:
        return ""
    if not settings.CLOUDINARY_CLOUD_NAME:
        return public_id
    _configure()
    options = {"fetch_format": "auto", "quality": "auto", "secure": True}
    if width:
        options["width"] = width
    if height:
        options["height"] = height
    if crop:
        options["crop"] = crop
    if gravity:
        options["gravity"] = gravity
    try:
        url, _ = cloudinary.utils.cloudinary_url(public_id, **options)
        return url
    except Exception:
        return public_id


def banner_url(public_id):
    """Wide banner image, scaled down to 1600px keeping aspect ratio."""
    return delivery_url(public_id, width=1600, crop="limit")


def avatar_url(public_id):
    """Square avatar for the circular crop (rounded to a circle in CSS)."""
    return delivery_url(public_id, width=320, height=320, crop="fill", gravity="auto")