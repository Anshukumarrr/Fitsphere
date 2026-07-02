from django.contrib import admin

from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("title", "raised_by", "category", "priority", "status", "created_at")
    list_filter = ("status", "category", "priority")
    search_fields = ("title", "description", "raised_by__email")
