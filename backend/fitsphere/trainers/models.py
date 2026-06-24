from django.conf import settings
from django.db import models

from ..core.models import TenantAwareModel


class Trainer(TenantAwareModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trainer_profile",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="trainers",
    )
    specialization = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    qualifications = models.TextField(blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    max_members = models.PositiveIntegerField(default=50)
    session_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0.0
    )
    total_sessions = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "trainers"
        indexes = [
            models.Index(fields=["organization", "branch"]),
        ]

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.specialization or 'General'}"


class TrainerPerformance(models.Model):
    trainer = models.ForeignKey(
        Trainer, on_delete=models.CASCADE, related_name="performance_records"
    )
    month = models.DateField()
    sessions_completed = models.PositiveIntegerField(default=0)
    sessions_missed = models.PositiveIntegerField(default=0)
    new_members_assigned = models.PositiveIntegerField(default=0)
    member_retention_count = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)

    class Meta:
        db_table = "trainer_performance"
        unique_together = ("trainer", "month")

    def __str__(self):
        return f"{self.trainer} - {self.month}"
