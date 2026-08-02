"""Backfill due_date for existing pending payments (30 days from creation),
matching the default the Payment.save() hook now applies to new ones."""
from django.db import migrations
from django.utils import timezone


def backfill_pending_due_dates(apps, schema_editor):
    Payment = apps.get_model("payments", "Payment")
    updated = 0
    for payment in Payment.objects.filter(status="pending", due_date__isnull=True):
        payment.due_date = payment.created_at.date() + timezone.timedelta(days=30)
        payment.save(update_fields=["due_date"])
        updated += 1
    if updated:
        print(f"  Backfilled due_date for {updated} pending payment(s)")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0003_payment_due_date_payment_payments_status_422e56_idx"),
    ]

    operations = [
        migrations.RunPython(backfill_pending_due_dates, noop),
    ]
