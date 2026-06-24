from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "create", "Create"
        UPDATE = "update", "Update"
        DELETE = "delete", "Delete"
        LOGIN = "login", "Login"
        LOGOUT = "logout", "Logout"
        FAILED_LOGIN = "failed_login", "Failed Login"

    organization = models.ForeignKey(
        "organizations.GymOrganization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    entity_type = models.CharField(max_length=100)
    entity_id = models.PositiveIntegerField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        indexes = [
            models.Index(fields=["organization", "timestamp"]),
            models.Index(fields=["user", "timestamp"]),
            models.Index(fields=["action", "timestamp"]),
        ]
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.get_action_display()} {self.entity_type} by {self.user or 'system'}"


def log_audit(
    user,
    action,
    entity_type,
    entity_id=None,
    details=None,
    organization=None,
    request=None,
):
    log = AuditLog(
        user=user,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details or {},
    )
    if organization:
        log.organization = organization
    if request:
        log.ip_address = request.META.get("REMOTE_ADDR")
        log.user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]
    log.save()
    return log
