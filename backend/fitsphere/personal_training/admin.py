from django.contrib import admin

from .models import PTPackage, PTMembership, PTSession


@admin.register(PTPackage)
class PTPackageAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "number_of_sessions", "price", "is_active")


@admin.register(PTMembership)
class PTMembershipAdmin(admin.ModelAdmin):
    list_display = ("member", "package", "trainer", "sessions_remaining", "is_active")


@admin.register(PTSession)
class PTSessionAdmin(admin.ModelAdmin):
    list_display = ("member", "trainer", "scheduled_date", "status")
    list_filter = ("status",)
