import logging

from celery import shared_task
from django.utils import timezone

from .models import NotificationPreference, NotificationTemplate
from .services import EmailService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email(self, recipient: str, subject: str, body: str, html_body: str = ""):
    service = EmailService()
    log = service.send(recipient, subject, body, html_body)
    if log.status == "failed":
        raise self.retry(exc=Exception(log.error_message or "Email send failed"))


@shared_task
def send_event_notification(
    recipient_email: str = "",
    event: str = "",
    context: dict | None = None,
    organization_id: int | None = None,
):
    from organizations.models import GymOrganization

    context = context or {}
    org = None
    if organization_id:
        org = GymOrganization.objects.filter(id=organization_id).first()

    templates = NotificationTemplate.objects.filter(event=event, is_active=True)
    for template in templates:
        prefs = NotificationPreference.objects.filter(
            organization=org,
            event=event,
            channel=template.channel,
            enabled=True,
        )
        if not prefs.exists():
            continue

        if template.channel == "email" and recipient_email:
            email_service = EmailService()
            email_service.send_template(recipient_email, template, context)


@shared_task
def check_membership_expiry():
    from datetime import timedelta

    from members.models import Member
    from memberships.models import MemberMembership

    now = timezone.now().date()
    check_days = [1, 3, 7]
    for days in check_days:
        target_date = now + timedelta(days=days)
        memberships = MemberMembership.objects.filter(
            end_date=target_date, is_active=True
        ).select_related("member", "member__user", "plan", "organization")

        for mem in memberships:
            prefs = NotificationPreference.objects.filter(
                organization=mem.organization_id,
                event="membership_expiry",
                enabled=True,
            ).select_related("organization")

            for pref in prefs:
                if pref.channel != "email":
                    continue
                member = mem.member
                email = member.user.email
                if not email:
                    continue
                templates = NotificationTemplate.objects.filter(
                    event="membership_expiry", channel="email", is_active=True
                )
                for tmpl in templates:
                    msg = tmpl.body_template.format(
                        name=member.user.first_name,
                        plan=mem.plan.name if mem.plan else "Membership",
                        end_date=mem.end_date,
                        days=days,
                    )
                    subject = tmpl.subject
                    send_email.delay(email, subject, msg)

    expired_date = now - timedelta(days=1)
    expired_memberships = MemberMembership.objects.filter(
        end_date=expired_date, is_active=True
    ).select_related("member", "member__user", "plan", "organization")

    for mem in expired_memberships:
        prefs = NotificationPreference.objects.filter(
            organization=mem.organization_id,
            event="membership_expired",
            enabled=True,
        ).select_related("organization")

        for pref in prefs:
            if pref.channel != "email":
                continue
            member = mem.member
            email = member.user.email
            if not email:
                continue
            templates = NotificationTemplate.objects.filter(
                event="membership_expired", channel="email", is_active=True
            )
            for tmpl in templates:
                msg = tmpl.body_template.format(
                    name=member.user.first_name,
                    plan=mem.plan.name if mem.plan else "Membership",
                    end_date=mem.end_date,
                )
                subject = tmpl.subject
                send_email.delay(email, subject, msg)


@shared_task
def check_payment_due():
    from datetime import timedelta

    from payments.models import Payment

    now = timezone.now().date()
    check_days = [1, 3, 7]
    for days in check_days:
        target_date = now + timedelta(days=days)
        due_payments = Payment.objects.filter(
            status="pending", paid_at__date=target_date
        ).select_related("member", "member__user", "organization")

        for payment in due_payments:
            prefs = NotificationPreference.objects.filter(
                organization=payment.organization_id,
                event="payment_due",
                enabled=True,
            ).select_related("organization")

            for pref in prefs:
                if pref.channel != "email":
                    continue
                member = payment.member
                email = member.user.email
                if not email:
                    continue
                templates = NotificationTemplate.objects.filter(
                    event="payment_due", channel="email", is_active=True
                )
                for tmpl in templates:
                    msg = tmpl.body_template.format(
                        name=member.user.first_name,
                        amount=payment.amount,
                        invoice=payment.invoice_number,
                        due_date=payment.paid_at.date() if payment.paid_at else "",
                    )
                    subject = tmpl.subject
                    send_email.delay(email, subject, msg)


@shared_task
def check_pt_session_reminder():
    from datetime import timedelta

    from personal_training.models import PTSession

    now = timezone.now().date()
    tomorrow = now + timedelta(days=1)

    sessions = PTSession.objects.filter(
        scheduled_date=tomorrow, status="scheduled"
    ).select_related("member", "member__user", "trainer", "trainer__user", "organization")

    for session in sessions:
        prefs = NotificationPreference.objects.filter(
            organization=session.organization_id,
            event="pt_session_reminder",
            enabled=True,
        )

        for pref in prefs:
            if pref.channel != "email":
                continue
            member = session.member
            email = member.user.email
            if not email:
                continue
            templates = NotificationTemplate.objects.filter(
                event="pt_session_reminder", channel="email", is_active=True
            )
            for tmpl in templates:
                msg = tmpl.body_template.format(
                    name=member.user.first_name,
                    trainer=session.trainer.user.get_full_name() if session.trainer else "Trainer",
                    date=session.scheduled_date,
                    time=session.scheduled_time,
                )
                subject = tmpl.subject
                send_email.delay(email, subject, msg)
