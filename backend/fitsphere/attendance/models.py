import random
import string
import uuid

from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from ..core.models import TenantAwareModel


class QRCode(models.Model):
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.CASCADE,
        related_name="qr_codes",
    )
    code = models.UUIDField(default=uuid.uuid4, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "qr_codes"

    def __str__(self):
        return f"QR for {self.branch.name} - {self.code}"


class AttendanceLog(TenantAwareModel):
    class CheckInMethod(models.TextChoices):
        QR = "qr", "QR Scan"
        MANUAL = "manual", "Manual Entry"
        CODE = "code", "Code Entry"

    member = models.ForeignKey(
        "members.Member",
        on_delete=models.CASCADE,
        related_name="attendance_logs",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        related_name="attendance_logs",
    )
    trainer = models.ForeignKey(
        "trainers.Trainer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendance_logs",
    )
    check_in_time = models.DateTimeField(auto_now_add=True)
    check_in_method = models.CharField(
        max_length=10, choices=CheckInMethod.choices
    )
    marked_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="marked_attendance",
    )
    session_type = models.CharField(max_length=50, blank=True, default="regular")
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "attendance_logs"
        indexes = [
            models.Index(fields=["member", "check_in_time"]),
            models.Index(fields=["branch", "check_in_time"]),
            models.Index(fields=["organization", "check_in_time"]),
        ]
        ordering = ["-check_in_time"]

    def __str__(self):
        return f"{self.member} checked in at {self.check_in_time}"


class AttendanceCode(TenantAwareModel):
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.CASCADE,
        null=True,
        related_name="attendance_codes",
    )
    code = models.CharField(max_length=5)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "attendance_codes"
        indexes = [
            models.Index(fields=["organization", "is_active", "expires_at"]),
        ]

    @classmethod
    def generate(cls, organization, branch, user):
        cls.objects.filter(
            organization=organization, branch=branch, is_active=True
        ).update(is_active=False)
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
        now = timezone.now()
        tomorrow = now.date() + timedelta(days=1)
        expires_at = timezone.make_aware(
            timezone.datetime(tomorrow.year, tomorrow.month, tomorrow.day, 0, 1)
        )
        return cls.objects.create(
            organization=organization,
            branch=branch,
            code=code,
            generated_by=user,
            generated_at=now,
            expires_at=expires_at,
            is_active=True,
        )

    def is_valid(self):
        return self.is_active and self.expires_at > timezone.now()

    def __str__(self):
        return f"{self.code} ({self.organization})"
