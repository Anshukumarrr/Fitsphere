from django.contrib import admin

from .models import Member


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "organization",
        "branch",
        "membership_status",
        "membership_end_date",
    )
    list_filter = ("membership_status", "organization", "branch")
    search_fields = ("user__first_name", "user__last_name", "user__email")
