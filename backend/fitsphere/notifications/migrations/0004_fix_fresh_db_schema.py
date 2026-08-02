# Fixes fresh databases that are missing schema that migrations 0002/0003
# only declared in state, never applied to the database.
#
# 0002_remove_whatsapp used SeparateDatabaseAndState with EMPTY
# database_operations, so on a fresh DB the following were never created:
#   - notification_preferences.channel column
#   - unique (organization_id, event, channel) on notification_preferences
#   - unique (event, channel) on notification_templates
#   (the old unique (organization_id, event) + single-column event unique
#    from 0001 remained instead)
#
# The production DB already has all of these (applied through other means),
# so every operation below is idempotent: it checks the live database state
# before altering anything. Safe to run on fresh DBs and on existing DBs.
#
# NOTE: pg_constraint.conkey stores column positions in constraint-definition
# order (not sorted by attnum), so constraints are matched here by their
# SORTED column-name set, which is order-independent.

from django.db import migrations

# Match helper: sorted column-name set of a unique constraint (order-independent).
#   :tbl       - regclass-qualified table (e.g. 'notification_preferences'::regclass)
#   :cols      - sorted array literal of expected columns, e.g. '{channel,event,organization_id}'
_CONSTRAINT_COLS = """
    (SELECT array_agg(a.attname ORDER BY a.attname)::text
     FROM pg_attribute a
     WHERE a.attrelid = %(tbl)s AND a.attnum = ANY(c.conkey) AND a.attnum > 0)
"""

SQL = """
-- 1. notification_preferences.channel column (idempotent)
ALTER TABLE notification_preferences
    ADD COLUMN IF NOT EXISTS channel varchar(10) NOT NULL DEFAULT 'email';

-- 2. notification_preferences: drop the old (organization_id, event) unique
--    (from 0001) if present, then ensure (organization_id, event, channel).
DO $$
DECLARE
    old_con text;
BEGIN
    SELECT conname INTO old_con
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = current_schema()
      AND t.relname = 'notification_preferences'
      AND c.contype = 'u'
      AND """ + _CONSTRAINT_COLS.replace('%(tbl)s', "t.oid") + r""" = '{event,organization_id}'::text
    LIMIT 1;

    IF old_con IS NOT NULL THEN
        EXECUTE format('ALTER TABLE notification_preferences DROP CONSTRAINT %I', old_con);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = current_schema()
          AND t.relname = 'notification_preferences'
          AND c.contype = 'u'
          AND """ + _CONSTRAINT_COLS.replace('%(tbl)s', "t.oid") + r""" = '{channel,event,organization_id}'::text
    ) THEN
        ALTER TABLE notification_preferences
            ADD CONSTRAINT notification_preferences_org_event_channel_uniq
            UNIQUE (organization_id, event, channel);
    END IF;
END $$;

-- 3. notification_templates: drop the old single-column UNIQUE on event
--    (from 0001's unique=True) if present, then ensure (event, channel).
DO $$
DECLARE
    old_con text;
BEGIN
    SELECT conname INTO old_con
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = current_schema()
      AND t.relname = 'notification_templates'
      AND c.contype = 'u'
      AND """ + _CONSTRAINT_COLS.replace('%(tbl)s', "t.oid") + r""" = '{event}'::text
    LIMIT 1;

    IF old_con IS NOT NULL THEN
        EXECUTE format('ALTER TABLE notification_templates DROP CONSTRAINT %I', old_con);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = current_schema()
          AND t.relname = 'notification_templates'
          AND c.contype = 'u'
          AND """ + _CONSTRAINT_COLS.replace('%(tbl)s', "t.oid") + r""" = '{channel,event}'::text
    ) THEN
        ALTER TABLE notification_templates
            ADD CONSTRAINT notification_templates_event_channel_uniq
            UNIQUE (event, channel);
    END IF;
END $$;
"""


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0003_apply_state_changes"),
    ]

    operations = [
        migrations.RunSQL(
            sql=SQL,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
