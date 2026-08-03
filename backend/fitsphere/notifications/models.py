import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


# Placeholders each scheduler-driven event's body_template may use. Mirrors the
# render kwargs in notifications/tasks.py — a typo like {nmae} silently kills
# the event (tasks._render returns None -> caller continues). Validated at
# template save time (H4); keep in sync with tasks.py and predictor.py.
EVENT_PLACEHOLDERS = {
    "membership_expiry": {"name", "plan", "end_date", "days"},
    "membership_expired": {"name", "plan", "end_date"},
    "payment_due": {"name", "amount", "invoice", "due_date"},
    "pt_session_reminder": {"name", "trainer", "date", "time"},
}


class NotificationTemplate(models.Model):
    class Channel(models.TextChoices):
        EMAIL = "email", "Email"

    class Event(models.TextChoices):
        MEMBERSHIP_EXPIRY = "membership_expiry", "Membership Expiry Reminder"
        MEMBERSHIP_EXPIRED = "membership_expired", "Membership Expired"
        PAYMENT_DUE = "payment_due", "Payment Due Reminder"
        PT_SESSION_REMINDER = "pt_session_reminder", "PT Session Reminder"
        ANNOUNCEMENT = "announcement", "Gym Announcement"
        STAFF_INVITE = "staff_invite", "Staff Invite"
        WELCOME = "welcome", "Welcome"

    name = models.CharField(max_length=255)
    event = models.CharField(max_length=50, choices=Event.choices)
    channel = models.CharField(max_length=10, choices=Channel.choices, default=Channel.EMAIL)
    subject = models.CharField(max_length=500, blank=True)
    body_template = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notification_templates"
        unique_together = ("event", "channel")

    def __str__(self):
        return f"{self.get_event_display()} ({self.get_channel_display()})"

    def clean(self):
        """Reject body placeholders that the scheduler can never render (H4).

        A typo like {nmae} would make tasks._render return None and the whole
        event silently stop emailing. Django admin ModelForms run full_clean(),
        so template edits are validated on save.
        """
        super().clean()
        allowed = EVENT_PLACEHOLDERS.get(self.event)
        if allowed is None:
            return  # non-scheduler events (announcement/staff_invite/welcome) not constrained
        found = set(re.findall(r"\{(\w+)\}", self.body_template))
        unknown = found - allowed
        if unknown:
            raise ValidationError({
                "body_template": (
                    f"Unknown placeholder(s): {', '.join(sorted(unknown))}. "
                    f"Allowed for {self.event}: {', '.join(sorted(allowed))}"
                )
            })


class EmailLog(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    recipient = models.EmailField()
    subject = models.CharField(max_length=500)
    body = models.TextField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "email_logs"
        indexes = [models.Index(fields=["status"])]

    def __str__(self):
        return f"Email to {self.recipient} - {self.status}"

class NotificationPreference(models.Model):
    organization = models.ForeignKey(
        "organizations.GymOrganization",
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )
    event = models.CharField(max_length=50, choices=NotificationTemplate.Event.choices)
    channel = models.CharField(
        max_length=10, choices=NotificationTemplate.Channel.choices,
        default=NotificationTemplate.Channel.EMAIL,
    )
    enabled = models.BooleanField(default=True)
    reminder_days = models.IntegerField(
        null=True, blank=True,
        help_text="Days before event to send reminder"
    )

    class Meta:
        db_table = "notification_preferences"
        unique_together = ("organization", "event", "channel")

    def __str__(self):
        return f"{self.organization.name} - {self.event} ({self.channel}): {'On' if self.enabled else 'Off'}"
