from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_number",
        "member",
        "amount",
        "payment_type",
        "status",
        "paid_at",
    )
    list_filter = ("status", "payment_type", "payment_method")
    search_fields = ("invoice_number", "member__user__first_name")
