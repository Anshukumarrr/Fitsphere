from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0001_initial"),
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notificationtemplate",
            name="event",
            field=models.CharField(
                choices=[
                    ("membership_expiry", "Membership Expiry Reminder"),
                    ("payment_due", "Payment Due Reminder"),
                    ("pt_session_reminder", "PT Session Reminder"),
                    ("announcement", "Gym Announcement"),
                    ("staff_invite", "Staff Invite"),
                    ("welcome", "Welcome"),
                ],
                max_length=50,
            ),
        ),
        migrations.AlterField(
            model_name="notificationtemplate",
            name="channel",
            field=models.CharField(
                choices=[
                    ("email", "Email"),
                    ("sms", "SMS"),
                    ("whatsapp", "WhatsApp"),
                ],
                default="email",
                max_length=10,
            ),
        ),
        migrations.AlterUniqueTogether(
            name="notificationtemplate",
            unique_together={("event", "channel")},
        ),
        migrations.CreateModel(
            name="WhatsAppMessageLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("recipient_phone", models.CharField(max_length=20)),
                ("message", models.TextField()),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("sent", "Sent"), ("failed", "Failed")],
                        default="pending",
                        max_length=10,
                    ),
                ),
                ("event", models.CharField(blank=True, max_length=50)),
                ("error_message", models.TextField(blank=True)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("retry_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "organization",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="whatsapp_logs",
                        to="organizations.gymorganization",
                    ),
                ),
            ],
            options={
                "db_table": "whatsapp_message_logs",
                "indexes": [
                    models.Index(fields=["status"], name="whatsapp_message_logs_status_idx"),
                    models.Index(fields=["organization", "created_at"], name="whatsapp_msg_log_org_created_idx"),
                ],
            },
        ),
        migrations.AddField(
            model_name="notificationpreference",
            name="channel",
            field=models.CharField(
                choices=[
                    ("email", "Email"),
                    ("sms", "SMS"),
                    ("whatsapp", "WhatsApp"),
                ],
                default="whatsapp",
                max_length=10,
            ),
        ),
        migrations.AlterUniqueTogether(
            name="notificationpreference",
            unique_together={("organization", "event", "channel")},
        ),
    ]
