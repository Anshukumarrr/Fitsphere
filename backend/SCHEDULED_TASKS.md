# Scheduled Reminder Tasks

FitSphere uses **APScheduler** (in-process) to run automated reminder emails — no Celery, Redis, or external cron service required.

## What Runs Automatically

| Job | Time (UTC) | Description |
|---|---|---|
| `check_pt_session_reminder` | 07:00 daily | PT session reminder for sessions scheduled tomorrow |
| `check_membership_expiry` | 08:00 daily | Reminders 7/3/1 day before expiry + "expired" notice 1 day after |
| `check_payment_due` | 08:30 daily | Payment due reminders 7/3/1 day before |

## How It Works

- The scheduler lives in `notifications/scheduler.py`
- Started automatically from `notifications/apps.py` → `ready()` when gunicorn boots
- Runs inside the **single gunicorn worker** (workers=1, threads=4, gthread worker class)
- Jobs persist in memory only — they're re-registered every time the app starts

## The Check Functions

All live in `backend/fitsphere/notifications/tasks.py`:
- `check_membership_expiry()` — queries `MemberMembership` by `end_date`
- `check_payment_due()` — queries `Payment` by `due_date` (status=pending, due 7/3/1 days out)
- `check_pt_session_reminder()` — queries `PTSession` by `scheduled_date`

Each reads templates from `NotificationTemplate` (DB) and HTML templates from `core/templates/emails/`.

## If You Needed to Trigger Manually

```python
from fitsphere.notifications.tasks import check_membership_expiry
check_membership_expiry()
```

## Previously

This replaced a Celery Beat + Redis setup that wasn't free on Render. APScheduler is simpler, zero-infrastructure, and runs inside the existing web process.
