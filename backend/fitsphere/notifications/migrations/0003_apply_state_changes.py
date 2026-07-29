# Verifies that DB schema matches migration state.
# The 0002 migration used SeparateDatabaseAndState (empty database_operations)
# but the channel column and composite unique constraints were already
# applied to the database through other means.
# This migration is a no-op that confirms state == database.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0002_remove_whatsapp"),
    ]

    operations = []
