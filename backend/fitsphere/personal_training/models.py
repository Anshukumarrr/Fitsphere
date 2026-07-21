from django.conf import settings
from django.db import models

from ..core.models import TenantAwareModel


class PTPackage(TenantAwareModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    number_of_sessions = models.PositiveIntegerField()
    validity_days = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pt_packages"
        unique_together = ("organization", "name")

    def __str__(self):
        return f"{self.name} ({self.number_of_sessions} sessions)"


class PTMembership(TenantAwareModel):
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.CASCADE,
        related_name="pt_memberships",
    )
    package = models.ForeignKey(
        PTPackage, on_delete=models.SET_NULL, null=True, related_name="memberships"
    )
    trainer = models.ForeignKey(
        "trainers.Trainer",
        on_delete=models.SET_NULL,
        null=True,
        related_name="pt_memberships",
    )
    sessions_total = models.PositiveIntegerField()
    sessions_used = models.PositiveIntegerField(default=0)
    sessions_remaining = models.PositiveIntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pt_memberships"
        indexes = [
            models.Index(fields=["organization", "member"]),
        ]

    def __str__(self):
        return f"{self.member} - {self.package}"


class PTSession(TenantAwareModel):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        COMPLETED = "completed", "Completed"
        MISSED = "missed", "Missed"
        CANCELLED = "cancelled", "Cancelled"

    pt_membership = models.ForeignKey(
        PTMembership,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="sessions",
    )
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.CASCADE,
        related_name="pt_sessions",
    )
    trainer = models.ForeignKey(
        "trainers.Trainer",
        on_delete=models.CASCADE,
        related_name="pt_sessions",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        related_name="pt_sessions",
    )
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SCHEDULED
    )
    progress_notes = models.TextField(blank=True)
    rating = models.PositiveIntegerField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pt_sessions"
        indexes = [
            models.Index(fields=["trainer", "scheduled_date"]),
            models.Index(fields=["member", "scheduled_date"]),
            models.Index(fields=["organization", "scheduled_date"]),
        ]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        was_completed = False
        if not is_new:
            try:
                old = PTSession.objects.get(pk=self.pk)
                was_completed = old.status == "completed" and old.completed_at is not None
            except PTSession.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        if self.pt_membership_id and self.status == "completed" and not was_completed:
            PTMembership.objects.filter(pk=self.pt_membership_id).update(
                sessions_used=models.F("sessions_used") + 1,
                sessions_remaining=models.F("sessions_remaining") - 1,
            )

    def __str__(self):
        return f"{self.member} with {self.trainer} on {self.scheduled_date}"
