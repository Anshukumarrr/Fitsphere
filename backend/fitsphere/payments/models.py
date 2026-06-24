from django.conf import settings
from django.db import models

from ..core.models import TenantAwareModel


class Payment(TenantAwareModel):
    class PaymentType(models.TextChoices):
        MEMBERSHIP = "membership", "Membership"
        PT_PACKAGE = "pt_package", "PT Package"
        RENEWAL = "renewal", "Renewal"
        OTHER = "other", "Other"

    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Cash"
        CARD = "card", "Card"
        UPI = "upi", "UPI"
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        ONLINE = "online", "Online"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    member = models.ForeignKey(
        "members.Member",
        on_delete=models.CASCADE,
        related_name="payments",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices)
    payment_method = models.CharField(
        max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH
    )
    status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.COMPLETED
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    invoice_pdf = models.FileField(
        upload_to="invoices/", blank=True, null=True
    )
    description = models.TextField(blank=True)
    reference_id = models.CharField(
        max_length=255, blank=True,
        help_text="External payment gateway reference"
    )
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="received_payments",
    )
    paid_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments"
        indexes = [
            models.Index(fields=["organization", "paid_at"]),
            models.Index(fields=["member", "payment_type"]),
            models.Index(fields=["status"]),
        ]
        ordering = ["-paid_at"]

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            from datetime import datetime
            prefix = "INV"
            date_part = datetime.now().strftime("%Y%m%d")
            last = Payment.objects.filter(
                invoice_number__startswith=f"{prefix}{date_part}"
            ).count()
            self.invoice_number = f"{prefix}{date_part}-{last + 1:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.invoice_number} - {self.member} - {self.amount} ({self.status})"
        )
