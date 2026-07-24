from django.conf import settings
from django.db import models


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
