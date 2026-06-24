from django.conf import settings
from django.db import models

from ..core.models import TenantAwareModel


class MembershipPlan(TenantAwareModel):
    class Duration(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        QUARTERLY = "quarterly", "Quarterly"
        HALF_YEARLY = "half_yearly", "Half Yearly"
        YEARLY = "yearly", "Yearly"

    class BillingCycle(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"
        ONE_TIME = "one_time", "One Time"

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    duration = models.CharField(max_length=20, choices=Duration.choices)
    duration_days = models.PositiveIntegerField(
        help_text="Duration in days for calculation"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    billing_cycle = models.CharField(
        max_length=20, choices=BillingCycle.choices, default=BillingCycle.ONE_TIME
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "membership_plans"
        unique_together = ("organization", "name")

    def __str__(self):
        return f"{self.name} - {self.get_duration_display()}"


class MemberMembership(TenantAwareModel):
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    plan = models.ForeignKey(
        MembershipPlan,
        on_delete=models.SET_NULL,
        null=True,
        related_name="member_plans",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    is_frozen = models.BooleanField(default=False)
    freeze_start = models.DateField(null=True, blank=True)
    freeze_end = models.DateField(null=True, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "member_memberships"
        indexes = [
            models.Index(fields=["member", "is_active"]),
            models.Index(fields=["end_date"]),
        ]

    def __str__(self):
        return f"{self.member} - {self.plan} ({self.start_date} to {self.end_date})"


class MembershipRenewal(models.Model):
    member_membership = models.ForeignKey(
        MemberMembership,
        on_delete=models.CASCADE,
        related_name="renewals",
    )
    previous_end_date = models.DateField()
    new_end_date = models.DateField()
    amount_charged = models.DecimalField(max_digits=10, decimal_places=2)
    renewed_at = models.DateTimeField(auto_now_add=True)
    renewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )

    class Meta:
        db_table = "membership_renewals"
