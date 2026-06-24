from django.contrib import admin

from .models import DashboardCache


@admin.register(DashboardCache)
class DashboardCacheAdmin(admin.ModelAdmin):
    list_display = ("organization", "cache_key", "generated_at")
