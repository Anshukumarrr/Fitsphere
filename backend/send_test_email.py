"""Test email script — sends a real email through Brevo.

Usage (from backend/):
    venv/Scripts/python send_test_email.py [recipient@example.com]

Defaults to anshupersonal2471@gmail.com. Uses the same EmailService that the
scheduled reminder tasks use (retries + EmailLog), so if this works, the
scheduler's email path works.
"""
import os
import sys
from datetime import datetime

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from fitsphere.notifications.services import EmailService  # noqa: E402

RECIPIENT = sys.argv[1] if len(sys.argv) > 1 else "anshupersonal2471@gmail.com"


def main():
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    subject = f"[FitSphere] Brevo test email — {now}"
    body = (
        "Hi Anshu,\n\n"
        "This is a test email sent through Brevo to confirm the email pipeline works.\n"
        f"Sent at: {now}\n\n"
        "If you're reading this, Brevo delivery is working end-to-end.\n\n"
        "— FitSphere\n"
    )
    html_body = (
        "<h2 style='font-family:sans-serif'>FitSphere — Brevo test</h2>"
        "<p>Hi Anshu,</p>"
        "<p>This is a test email sent through <strong>Brevo</strong> to confirm "
        "the email pipeline works.</p>"
        f"<p>Sent at: <code>{now}</code></p>"
        "<p>If you're reading this, Brevo delivery is working end-to-end. ✅</p>"
        "<p style='color:#777'>— FitSphere</p>"
    )

    print(f"Sending test email via Brevo to: {RECIPIENT}")
    print(f"Subject: {subject}")

    service = EmailService()
    log = service.send(RECIPIENT, subject, body, html_body)

    if log.status == "sent":
        print(f"\n✅ EMAIL SENT — EmailLog id={log.id}, sent_at={log.sent_at}")
        print("Check the inbox (and spam folder) at the address above.")
        return 0
    else:
        print(f"\n❌ EMAIL FAILED — EmailLog id={log.id}, status={log.status}")
        print(f"   error: {log.error_message}")
        print("   Check BREVO_API_KEY in config/settings.py / .env")
        return 1


if __name__ == "__main__":
    sys.exit(main())
