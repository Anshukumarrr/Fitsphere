from django.contrib import admin

from .models import Trainer


@admin.register(Trainer)
class TrainerAdmin(admin.ModelAdmin):
    list_display = ("user", "organization", "specialization", "is_active")
    list_filter = ("is_active", "specialization", "organization")
    search_fields = ("user__first_name", "user__last_name", "specialization")
