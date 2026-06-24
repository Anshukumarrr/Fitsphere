from django.contrib import admin

from .models import MembershipPlan, MemberMembership


@admin.register(MembershipPlan)
class MembershipPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "duration", "price", "is_active")
    list_filter = ("duration", "is_active", "organization")


@admin.register(MemberMembership)
class MemberMembershipAdmin(admin.ModelAdmin):
    list_display = ("member", "plan", "start_date", "end_date", "is_active")
    list_filter = ("is_active", "plan")
