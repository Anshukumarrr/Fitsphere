import json
import logging

from decouple import config
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from .models import EmailLog, NotificationTemplate, WhatsAppMessageLog

logger = logging.getLogger(__name__)

OPENWA_URL = config("OPENWA_URL", default="http://openwa:2785")
OPENWA_API_KEY = config("OPENWA_API_KEY", default="")


class WhatsAppService:
    def send(self, recipient_phone: str, message: str, event: str = "", organization=None) -> WhatsAppMessageLog:
        log = WhatsAppMessageLog.objects.create(
            organization=organization,
            recipient_phone=recipient_phone,
            message=message,
            event=event,
            status=WhatsAppMessageLog.Status.PENDING,
        )
        try:
            self._send_via_openwa(recipient_phone, message)
            log.status = WhatsAppMessageLog.Status.SENT
            log.sent_at = timezone.now()
            log.save(update_fields=["status", "sent_at"])
        except Exception as e:
            logger.exception("WhatsApp send failed to %s", recipient_phone)
            log.status = WhatsAppMessageLog.Status.FAILED
            log.error_message = str(e)
            log.save(update_fields=["status", "error_message"])
        return log

    def _get_active_session(self) -> str:
        import urllib.request
        import urllib.error

        req = urllib.request.Request(
            f"{OPENWA_URL}/api/sessions",
            headers={"X-API-Key": OPENWA_API_KEY},
            method="GET",
        )
        try:
            resp = urllib.request.urlopen(req, timeout=10)
            sessions = json.loads(resp.read().decode())
            ready_sessions = [s for s in sessions if s.get("status") == "ready"]
            if not ready_sessions:
                raise RuntimeError("No active WhatsApp session found")
            return ready_sessions[0]["id"]
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"OpenWA session list error {e.code}: {e.read().decode()}") from e

    def _resolve_chat_id(self, session: str, phone: str) -> str:
        import urllib.request
        import urllib.error

        raw_phone = phone.replace("+", "")
        url = f"{OPENWA_URL}/api/sessions/{session}/contacts/check/{raw_phone}%40c.us"
        req = urllib.request.Request(url, headers={"X-API-Key": OPENWA_API_KEY}, method="GET")
        try:
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())
            if data.get("exists"):
                return data["whatsappId"]
        except urllib.error.HTTPError:
            pass
        return raw_phone + "@c.us"

    def _send_via_openwa(self, recipient_phone: str, message: str):
        import urllib.request
        import urllib.error

        session = self._get_active_session()
        chat_id = self._resolve_chat_id(session, recipient_phone)

        payload = json.dumps({
            "chatId": chat_id,
            "text": message,
        }).encode()
        req = urllib.request.Request(
            f"{OPENWA_URL}/api/sessions/{session}/messages/send-text",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "X-API-Key": OPENWA_API_KEY,
            },
            method="POST",
        )
        try:
            urllib.request.urlopen(req, timeout=60)
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"OpenWA API error {e.code}: {e.read().decode()}") from e

    def send_template(self, recipient_phone: str, template: NotificationTemplate, context: dict, organization=None) -> WhatsAppMessageLog:
        message = self._render_template(template, context)
        return self.send(recipient_phone, message, template.event, organization)

    def _render_template(self, template: NotificationTemplate, context: dict) -> str:
        return template.body_template.format(**context)


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
