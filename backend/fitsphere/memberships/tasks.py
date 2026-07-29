import logging
from datetime import date

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def deactivate_expired_memberships():
    from .models import MemberMembership

    today = date.today()
    expired = MemberMembership.objects.filter(end_date__lt=today, is_active=True)
    count = 0
    for m in expired.select_related("member").iterator():
        m.is_active = False
        m.save(update_fields=["is_active"])
        if not MemberMembership.objects.filter(
            member=m.member, is_active=True
        ).exclude(id=m.id).exists():
            m.member.membership_status = "expired"
            m.member.save(update_fields=["membership_status"])
        count += 1

    logger.info("Deactivated %d expired memberships", count)
    return count
