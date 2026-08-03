import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

# Jobs run on IST wall-clock time (12:30/13:30/14:00 IST = 07:00/08:00/08:30 UTC).
# Pinned explicitly (M2) so a machine with a non-IST local tz can't shift them.
scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
_started = False


def start():
    """Register jobs and start the background scheduler.

    Safe to call multiple times — runs only once.
    Designed for single-worker gunicorn (workers=1, threads=4, worker-class=gthread).
    """
    global _started
    if _started or scheduler.running:
        return
    _started = True

    from .tasks import check_membership_expiry, check_payment_due, check_pt_session_reminder

    # ── Membership expiry reminders ──────────────────────────────────
    # Runs daily at 1:30 PM IST — checks 7/3/1 day before expiry + 1 day after
    scheduler.add_job(
        check_membership_expiry,
        CronTrigger(hour=13, minute=30),
        id="notifications_check_membership_expiry",
        replace_existing=True,
        misfire_grace_time=None,
        coalesce=True,
        name="Membership expiry reminders",
    )

    # ── Payment due reminders ────────────────────────────────────────
    # Runs daily at 2:00 PM IST — checks 7/3/1 day before payment due
    scheduler.add_job(
        check_payment_due,
        CronTrigger(hour=14, minute=0),
        id="notifications_check_payment_due",
        replace_existing=True,
        misfire_grace_time=None,
        coalesce=True,
        name="Payment due reminders",
    )

    # ── PT session reminders ─────────────────────────────────────────
    # Runs daily at 12:30 PM IST — reminds about PT sessions scheduled today
    scheduler.add_job(
        check_pt_session_reminder,
        CronTrigger(hour=12, minute=30),
        id="notifications_check_pt_session_reminder",
        replace_existing=True,
        misfire_grace_time=None,
        coalesce=True,
        name="PT session reminders",
    )

    scheduler.start()
    logger.info(
        "APScheduler started — jobs: pt_session_reminder(12:30 IST), "
        "membership_expiry(13:30 IST), payment_due(14:00 IST)"
    )
