from django.contrib import admin

from .models import Branch, GymOrganization, StaffInvite


@admin.register(GymOrganization)
class GymOrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "contact_email", "is_active", "created_at")
    search_fields = ("name", "contact_email")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "city", "is_active")
    list_filter = ("organization", "is_active")
    search_fields = ("name", "city")


@admin.register(StaffInvite)
class StaffInviteAdmin(admin.ModelAdmin):
    list_display = ("email", "role", "organization", "status", "created_at")
    list_filter = ("status", "role")
