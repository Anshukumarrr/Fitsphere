import logging

logger = logging.getLogger(__name__)


def rotate_invite_codes():
    """Pre-create today's staff/member invite codes for all org/branch combos.

    Runs daily at 00:01 IST via the APScheduler in notifications/scheduler.py.
    ``InviteCode.get_current`` is the lazy fallback when this job misses a tick,
    so signup codes can never go stale.
    """
    from .models import InviteCode

    created = InviteCode.rotate_all()
    if created:
        logger.info("Invite codes: pre-created %d for today (IST)", created)
