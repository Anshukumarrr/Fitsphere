import logging

from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone

from .models import NotificationPreference, NotificationTemplate
from .services import EmailService

logger = logging.getLogger(__name__)


def _prefs_by_org(org_ids: set, event: str) -> dict:
    if not org_ids:
        return {}
    prefs = NotificationPreference.objects.filter(
        organization_id__in=org_ids, event=event, channel="email", enabled=True
    ).values_list("organization_id", flat=True)
    return {oid: True for oid in prefs}


def _render(template_body: str, **kwargs) -> str | None:
    try:
        return template_body.format(**kwargs)
    except KeyError as e:
        logger.error("Template rendering failed: missing key %s in %s", e, template_body)
        return None


def send_email(recipient: str, subject: str, body: str, html_body: str = ""):
    service = EmailService()
    service.send(recipient, subject, body, html_body)


def send_event_notification(
    recipient_email: str = "",
    event: str = "",
    context: dict | None = None,
    organization_id: int | None = None,
):
    context = context or {}

    templates = NotificationTemplate.objects.filter(event=event, is_active=True)
    for template in templates:
        if template.channel != "email" or not recipient_email:
            continue

        prefs = NotificationPreference.objects.filter(
            organization_id=organization_id,
            event=event,
            channel=template.channel,
            enabled=True,
        )
        if not prefs.exists():
            continue

        email_service = EmailService()
        email_service.send_template(recipient_email, template, context)


def check_membership_expiry():
    from datetime import timedelta

    from fitsphere.memberships.models import MemberMembership

    now = timezone.now().date()

    expiry_templates = list(
        NotificationTemplate.objects.filter(
            event="membership_expiry", channel="email", is_active=True
        )
    )
    expired_templates = list(
        NotificationTemplate.objects.filter(
            event="membership_expired", channel="email", is_active=True
        )
    )
    if not expiry_templates and not expired_templates:
        logger.warning("check_membership_expiry: no active templates found, skipping")
        return

    check_days = [1, 3, 7]
    for days in check_days:
        target_date = now + timedelta(days=days)
        memberships = MemberMembership.objects.filter(
            end_date=target_date, is_active=True
        ).select_related("member", "member__user", "plan")

        org_ids = set(m.organization_id for m in memberships)
        prefs_by_org = _prefs_by_org(org_ids, "membership_expiry")

        for mem in memberships:
                if not prefs_by_org.get(mem.organization_id):
                    continue
                member = mem.member
                email = member.user.email
                if not email:
                    continue
                for tmpl in expiry_templates:
                    msg = _render(
                        tmpl.body_template,
                        name=member.user.first_name,
                        plan=mem.plan.name if mem.plan else "Membership",
                        end_date=mem.end_date,
                        days=days,
                    )
                    if msg is None:
                        continue
                    html_body = render_to_string("emails/membership_expiry.html", {
                        "name": member.user.first_name,
                        "plan": mem.plan.name if mem.plan else "Membership",
                        "end_date": mem.end_date,
                        "days": days,
                        "membership_id": mem.id,
                        "frontend_url": settings.FRONTEND_URL,
                    })
                    send_email(email, tmpl.subject, msg, html_body)

    expired_date = now - timedelta(days=1)
    expired_memberships = MemberMembership.objects.filter(
        end_date=expired_date, is_active=True
    ).select_related("member", "member__user", "plan")

    org_ids = set(m.organization_id for m in expired_memberships)
    prefs_by_org = _prefs_by_org(org_ids, "membership_expired")

    for mem in expired_memberships:
        if not prefs_by_org.get(mem.organization_id):
            continue
        member = mem.member
        email = member.user.email
        if not email:
            continue
        for tmpl in expired_templates:
            msg = _render(
                tmpl.body_template,
                name=member.user.first_name,
                plan=mem.plan.name if mem.plan else "Membership",
                end_date=mem.end_date,
            )
            if msg is None:
                continue
            html_body = render_to_string("emails/membership_expired.html", {
                "name": member.user.first_name,
                "plan": mem.plan.name if mem.plan else "Membership",
                "end_date": mem.end_date,
                "membership_id": mem.id,
                "frontend_url": settings.FRONTEND_URL,
            })
            send_email(email, tmpl.subject, msg, html_body)


def check_payment_due():
    from datetime import timedelta

    from fitsphere.payments.models import Payment

    templates = list(
        NotificationTemplate.objects.filter(
            event="payment_due", channel="email", is_active=True
        )
    )
    if not templates:
        logger.warning("check_payment_due: no active templates found, skipping")
        return

    now = timezone.now().date()
    check_days = [1, 3, 7]
    for days in check_days:
        target_date = now + timedelta(days=days)
        due_payments = Payment.objects.filter(
            status="pending", due_date=target_date
        ).select_related("member", "member__user")

        org_ids = set(p.organization_id for p in due_payments)
        prefs_by_org = _prefs_by_org(org_ids, "payment_due")

        for payment in due_payments:
            if not prefs_by_org.get(payment.organization_id):
                continue
            member = payment.member
            email = member.user.email
            if not email:
                continue
            for tmpl in templates:
                msg = _render(
                    tmpl.body_template,
                    name=member.user.first_name,
                    amount=payment.amount,
                    invoice=payment.invoice_number,
                    due_date=payment.due_date or "",
                )
                if msg is None:
                    continue
                html_body = render_to_string("emails/payment_due.html", {
                    "name": member.user.first_name,
                    "amount": payment.amount,
                    "invoice": payment.invoice_number,
                    "due_date": payment.due_date or "",
                    "frontend_url": settings.FRONTEND_URL,
                })
                send_email(email, tmpl.subject, msg, html_body)


def check_pt_session_reminder():
    from datetime import timedelta

    from fitsphere.personal_training.models import PTSession

    templates = list(
        NotificationTemplate.objects.filter(
            event="pt_session_reminder", channel="email", is_active=True
        )
    )
    if not templates:
        logger.warning("check_pt_session_reminder: no active templates found, skipping")
        return

    now = timezone.now().date()
    tomorrow = now + timedelta(days=1)

    sessions = PTSession.objects.filter(
        scheduled_date=tomorrow, status="scheduled"
    ).select_related("member", "member__user", "trainer", "trainer__user")

    org_ids = set(s.organization_id for s in sessions)
    prefs_by_org = _prefs_by_org(org_ids, "pt_session_reminder")

    for session in sessions:
        if not prefs_by_org.get(session.organization_id):
            continue
        member = session.member
        email = member.user.email
        if not email:
            continue
        for tmpl in templates:
            msg = _render(
                tmpl.body_template,
                name=member.user.first_name,
                trainer=session.trainer.user.get_full_name() if session.trainer else "Trainer",
                date=session.scheduled_date,
                time=session.scheduled_time,
            )
            if msg is None:
                continue
            html_body = render_to_string("emails/pt_session_reminder.html", {
                "name": member.user.first_name,
                "trainer": session.trainer.user.get_full_name() if session.trainer else "Trainer",
                "date": session.scheduled_date,
                "time": session.scheduled_time,
                "frontend_url": settings.FRONTEND_URL,
            })
            send_email(email, tmpl.subject, msg, html_body)
