# Scheduled Reminder Tasks

FitSphere sends automated reminder emails for:
- Membership expiry (1/3/7 days before + 1 day after expired)
- Payment due (1/3/7 days before)
- PT session reminder (day before)

The check functions live in `backend/fitsphere/notifications/tasks.py`. Trigger them via a cron-job.org, Better Uptime, or any free cron service pointing to a protected URL endpoint on your app, or via a GitHub Actions scheduled workflow.
