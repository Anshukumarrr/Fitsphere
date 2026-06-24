from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "entity_type", "user", "organization", "timestamp")
    list_filter = ("action", "entity_type", "timestamp")
    date_hierarchy = "timestamp"
