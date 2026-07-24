import logging

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from .models import EmailLog, NotificationTemplate

logger = logging.getLogger(__name__)


class EmailService:
    def send(self, recipient: str, subject: str, body: str, html_body: str = "") -> EmailLog:
        log = EmailLog.objects.create(
            recipient=recipient,
            subject=subject,
            body=body,
            status=EmailLog.Status.PENDING,
        )
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
        except Exception as e:
            logger.exception("Email send failed to %s", recipient)
            log.status = EmailLog.Status.FAILED
            log.error_message = str(e)
            log.save(update_fields=["status", "error_message"])
        return log

    def send_template(self, recipient: str, template: NotificationTemplate, context: dict) -> EmailLog:
        subject = template.subject.format(**context)
        body = template.body_template.format(**context)
        html_body = ""
        try:
            html_body = render_to_string(f"emails/{template.event}.html", context)
        except Exception:
            pass
        return self.send(recipient, subject, body, html_body)
