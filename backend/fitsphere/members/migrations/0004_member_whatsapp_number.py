from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("members", "0003_member_created_by"),
    ]

    operations = [
        migrations.AddField(
            model_name="member",
            name="whatsapp_number",
            field=models.CharField(
                blank=True,
                help_text="Phone number for WhatsApp notifications",
                max_length=20,
            ),
        ),
    ]
