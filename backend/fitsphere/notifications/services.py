import logging
from datetime import timedelta

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from .models import EmailLog, NotificationTemplate

logger = logging.getLogger(__name__)


class EmailService:
    MAX_RETRIES = 3
    # Suppress re-sends of an identical email (same recipient, subject AND body)
    # within this window. Double-triggers (gunicorn restart overlapping the
    # 08:00 run, manual task calls, deploy overlap) caused 4 duplicate
    # "Membership Expiring Soon" emails within 51 min on 07-28. Body is part of
    # the key because one static subject per event serves many legitimately
    # different emails (7/3/1-day reminders, consecutive PT sessions, multiple
    # invoices) — deduping on subject alone would collapse those.
    DEDUP_WINDOW_HOURS = 24

    def _find_recent_sent(self, recipient: str, subject: str, body: str) -> EmailLog | None:
        cutoff = timezone.now() - timedelta(hours=self.DEDUP_WINDOW_HOURS)
        return (
            EmailLog.objects.filter(
                recipient=recipient,
                subject=subject,
                body=body,
                status=EmailLog.Status.SENT,
                sent_at__gte=cutoff,
            )
            .order_by("-sent_at")
            .first()
        )

    def send(self, recipient: str, subject: str, body: str, html_body: str = "") -> EmailLog:
        existing = self._find_recent_sent(recipient, subject, body)
        if existing is not None:
            logger.warning(
                "Duplicate email suppressed (already sent %s): %s -> %s",
                existing.sent_at, subject, recipient,
            )
            return existing

        log = EmailLog.objects.create(
            recipient=recipient,
            subject=subject,
            body=body,
            status=EmailLog.Status.PENDING,
        )
        last_exception = None
        for attempt in range(self.MAX_RETRIES):
            try:
                send_mail(
                    subject=subject,
                    message=body,
                    html_message=html_body or None,
                    from_email=None,
                    recipient_list=[recipient],
                    fail_silently=False,
                )
                log.status = EmailLog.Status.SENT
                log.sent_at = timezone.now()
                log.save(update_fields=["status", "sent_at"])
                return log
            except Exception as e:
                last_exception = e
                log.retry_count = attempt + 1
                log.save(update_fields=["retry_count"])
                if attempt < self.MAX_RETRIES - 1:
                    import time
                    time.sleep(2 ** attempt)
        logger.exception("Email send failed to %s after %d retries", recipient, self.MAX_RETRIES)
        log.status = EmailLog.Status.FAILED
        log.error_message = str(last_exception)
        log.save(update_fields=["status", "error_message", "retry_count"])
        return log

    def send_template(self, recipient: str, template: NotificationTemplate, context: dict) -> EmailLog:
        subject = template.subject.format(**context)
        body = template.body_template.format(**context)
        html_body = ""
        try:
            html_body = render_to_string(f"emails/{template.event}.html", context)
        except Exception as e:
            logger.warning("Failed to render HTML template for %s: %s", template.event, e)
        return self.send(recipient, subject, body, html_body)
