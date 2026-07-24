from django.conf import settings
from django.db import models, transaction

from ..core.models import TenantAwareModel


class Member(TenantAwareModel):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"

    class MembershipStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        FROZEN = "frozen", "Frozen"
        CANCELLED = "cancelled", "Cancelled"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="member_profile",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="members",
    )
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10, choices=Gender.choices, blank=True
    )
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    health_notes = models.TextField(blank=True)
    photo = models.ImageField(upload_to="member_photos/", blank=True, null=True)
    membership_status = models.CharField(
        max_length=20,
        choices=MembershipStatus.choices,
        default=MembershipStatus.ACTIVE,
    )
    membership_start_date = models.DateField(null=True, blank=True)
    membership_end_date = models.DateField(null=True, blank=True)
    assigned_trainer = models.ForeignKey(
        "trainers.Trainer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_members",
    )
    whatsapp_number = models.CharField(
        max_length=20, blank=True,
        help_text="Phone number for WhatsApp notifications",
    )
    gym_code = models.CharField(max_length=10, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_members",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "members"
        unique_together = ("organization", "gym_code")
        indexes = [
            models.Index(fields=["organization", "membership_status"]),
            models.Index(fields=["organization", "branch"]),
        ]

    def save(self, *args, **kwargs):
        if not self.gym_code:
            with transaction.atomic():
                last = Member.objects.select_for_update().order_by("-id").first()
                seq = (last.id + 1) if last else 1
                self.gym_code = f"M{seq:06d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.membership_status})"
