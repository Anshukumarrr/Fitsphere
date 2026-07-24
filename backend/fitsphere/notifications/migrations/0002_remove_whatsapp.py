from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0001_initial'),
        ('organizations', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterUniqueTogether(
                    name='notificationpreference',
                    unique_together=set(),
                ),
            ],
            database_operations=[],
        ),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='notificationpreference',
                    name='channel',
                    field=models.CharField(choices=[('email', 'Email')], default='email', max_length=10),
                ),
            ],
            database_operations=[],
        ),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='notificationpreference',
                    name='event',
                    field=models.CharField(choices=[('membership_expiry', 'Membership Expiry Reminder'), ('membership_expired', 'Membership Expired'), ('payment_due', 'Payment Due Reminder'), ('pt_session_reminder', 'PT Session Reminder'), ('announcement', 'Gym Announcement'), ('staff_invite', 'Staff Invite'), ('welcome', 'Welcome')], max_length=50),
                ),
            ],
            database_operations=[],
        ),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='notificationtemplate',
                    name='channel',
                    field=models.CharField(choices=[('email', 'Email')], default='email', max_length=10),
                ),
            ],
            database_operations=[],
        ),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='notificationtemplate',
                    name='event',
                    field=models.CharField(choices=[('membership_expiry', 'Membership Expiry Reminder'), ('membership_expired', 'Membership Expired'), ('payment_due', 'Payment Due Reminder'), ('pt_session_reminder', 'PT Session Reminder'), ('announcement', 'Gym Announcement'), ('staff_invite', 'Staff Invite'), ('welcome', 'Welcome')], max_length=50),
                ),
            ],
            database_operations=[],
        ),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterUniqueTogether(
                    name='notificationpreference',
                    unique_together={('organization', 'event', 'channel')},
                ),
            ],
            database_operations=[],
        ),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterUniqueTogether(
                    name='notificationtemplate',
                    unique_together={('event', 'channel')},
                ),
            ],
            database_operations=[],
        ),
    ]
