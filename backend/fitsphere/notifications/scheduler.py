import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()
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
    # Runs daily at 8:00 AM — checks 7/3/1 day before expiry + 1 day after
    scheduler.add_job(
        check_membership_expiry,
        CronTrigger(hour=8, minute=0),
        id="notifications_check_membership_expiry",
        replace_existing=True,
        misfire_grace_time=None,
        coalesce=True,
        name="Membership expiry reminders",
    )

    # ── Payment due reminders ────────────────────────────────────────
    # Runs daily at 8:30 AM — checks 7/3/1 day before payment due
    scheduler.add_job(
        check_payment_due,
        CronTrigger(hour=8, minute=30),
        id="notifications_check_payment_due",
        replace_existing=True,
        misfire_grace_time=None,
        coalesce=True,
        name="Payment due reminders",
    )

    # ── PT session reminders ─────────────────────────────────────────
    # Runs daily at 7:00 AM — reminds about PT sessions scheduled today
    scheduler.add_job(
        check_pt_session_reminder,
        CronTrigger(hour=7, minute=0),
        id="notifications_check_pt_session_reminder",
        replace_existing=True,
        misfire_grace_time=None,
        coalesce=True,
        name="PT session reminders",
    )

    scheduler.start()
    logger.info(
        "APScheduler started — jobs: pt_session_reminder(07:00), "
        "membership_expiry(08:00), payment_due(08:30)"
    )
