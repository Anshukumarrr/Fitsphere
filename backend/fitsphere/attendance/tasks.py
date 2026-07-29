import logging
from datetime import timedelta

from celery import shared_task
from django.db.models import Count
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def generate_daily_attendance_report():
    from .models import AttendanceLog
    from ..organizations.models import GymOrganization

    yesterday = timezone.now().date() - timedelta(days=1)

    report = []
    for org in GymOrganization.objects.filter(is_active=True):
        total = AttendanceLog.objects.filter(
            organization=org, check_in_time__date=yesterday
        ).count()
        by_method = (
            AttendanceLog.objects.filter(
                organization=org, check_in_time__date=yesterday
            )
            .values("check_in_method")
            .annotate(count=Count("id"))
        )
        report.append({
            "org": org.name,
            "total": total,
            "by_method": {m["check_in_method"]: m["count"] for m in by_method},
        })

    logger.info("Daily attendance report: %s", report)
    return report
