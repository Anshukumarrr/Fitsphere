from django.contrib import admin

from .models import AttendanceLog, QRCode


@admin.register(AttendanceLog)
class AttendanceLogAdmin(admin.ModelAdmin):
    list_display = ("member", "branch", "check_in_time", "check_in_method")
    list_filter = ("check_in_method", "branch", "check_in_time")
    date_hierarchy = "check_in_time"


@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ("branch", "code", "is_active", "created_at")
