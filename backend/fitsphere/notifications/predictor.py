"""Upcoming-email prediction for the Email Center page.

Read-only mirror of the scheduler's filter logic in `notifications/tasks.py`
so the UI can show which emails WILL fire and which are blocked, before they
go out. KEEP the query windows, gates, and render kwargs in sync with
tasks.py (expiry 7/3/1-day, expired now-1, payment_due pending 7/3/1-day,
pt_session tomorrow/scheduled). The dedup gate reuses EmailService so the
24h window constant lives in exactly one place.
"""
import logging
from datetime import timedelta

from django.utils import timezone

from .models import EmailLog, NotificationPreference, NotificationTemplate
from .services import EmailService

logger = logging.getLogger(__name__)

EVENT_LABELS = {
    "membership_expiry": "Membership Expiry Reminder",
    "membership_expired": "Membership Expired",
    "payment_due": "Payment Due Reminder",
    "pt_session_reminder": "PT Session Reminder",
}

# Mirrors tasks._render — a broken {placeholder} must surface as a status
# instead of silently killing the event (H4).
def _render(body_template: str, **kwargs) -> str | None:
    try:
        return body_template.format(**kwargs)
    except (KeyError, IndexError) as e:
        logger.error("Template rendering failed for preview: %s in %s", e, body_template)
        return None


def _active_template(event: str) -> NotificationTemplate | None:
    return NotificationTemplate.objects.filter(
        event=event, channel="email", is_active=True
    ).first()


def _org_pref_enabled(org_id: int | None, event: str) -> bool:
    if org_id is None:
        return False
    return NotificationPreference.objects.filter(
        organization_id=org_id, event=event, channel="email", enabled=True
    ).exists()


def predict_upcoming_sends(organization_id: int | None = None) -> list[dict]:
    """What the scheduler would send if it ran right now.

    organization_id=None → all orgs (super_admin). Each returned row is one
    candidate email with a status explaining why it will or won't fire.
    """
    from fitsphere.memberships.models import MemberMembership
    from fitsphere.payments.models import Payment
    from fitsphere.personal_training.models import PTSession

    now = timezone.now().date()
    service = EmailService()
    rows: list[dict] = []

    def evaluate(event, *, recipient, member_name, org_id, org_name,
                 trigger_date, days, render_kwargs):
        base = {
            "event": event,
            "event_label": EVENT_LABELS.get(event, event),
            "recipient": recipient,
            "member_name": member_name,
            "org_id": org_id,
            "org_name": org_name,
            "trigger_date": trigger_date.isoformat() if trigger_date else None,
            "days": days,
            "planned_date": now.isoformat(),
        }
        tmpl = _active_template(event)
        if tmpl is None:
            base.update(status="blocked_template", reason="No active email template for this event", subject="")
            rows.append(base)
            return
        if not _org_pref_enabled(org_id, event):
            base.update(status="blocked_pref", reason="Notification preference is OFF for this org", subject="")
            rows.append(base)
            return
        if not recipient:
            base.update(status="no_email", reason="Member has no email address", subject="")
            rows.append(base)
            return
        body = _render(tmpl.body_template, **render_kwargs)
        if body is None:
            base.update(status="render_error", reason="Template body has a broken placeholder", subject=tmpl.subject)
            rows.append(base)
            return
        subject = tmpl.subject
        duplicate = service._find_recent_sent(recipient, subject, body)
        if duplicate is not None:
            base.update(status="suppressed_dedup", reason="Already sent in the last 24h — will be skipped", subject=subject)
            rows.append(base)
            return
        base.update(status="will_send", reason="Template active, pref ON, within dedup window", subject=subject)
        rows.append(base)

    def scoped(qs):
        if organization_id is not None:
            return qs.filter(organization_id=organization_id)
        return qs

    # --- Membership expiry reminders (7/3/1 days before end_date) ---
    for days in (1, 3, 7):
        memberships = scoped(
            MemberMembership.objects.filter(
                end_date=now + timedelta(days=days), is_active=True
            ).select_related("member", "member__user", "plan", "organization")
        )
        for mem in memberships:
            member = mem.member
            evaluate(
                "membership_expiry",
                recipient=getattr(getattr(member, "user", None), "email", None) or "",
                member_name=_display_name(member),
                org_id=mem.organization_id,
                org_name=mem.organization.name if mem.organization else "",
                trigger_date=mem.end_date,
                days=days,
                render_kwargs={
                    "name": getattr(getattr(member, "user", None), "first_name", "") or "",
                    "plan": mem.plan.name if mem.plan else "Membership",
                    "end_date": mem.end_date,
                    "days": days,
                },
            )

    # --- Membership expired notice (1 day after end_date) ---
    expired = scoped(
        MemberMembership.objects.filter(
            end_date=now - timedelta(days=1), is_active=True
        ).select_related("member", "member__user", "plan", "organization")
    )
    for mem in expired:
        member = mem.member
        evaluate(
            "membership_expired",
            recipient=getattr(getattr(member, "user", None), "email", None) or "",
            member_name=_display_name(member),
            org_id=mem.organization_id,
            org_name=mem.organization.name if mem.organization else "",
            trigger_date=mem.end_date,
            days=None,
            render_kwargs={
                "name": getattr(getattr(member, "user", None), "first_name", "") or "",
                "plan": mem.plan.name if mem.plan else "Membership",
                "end_date": mem.end_date,
            },
        )

    # --- Payment due reminders (7/3/1 days before due_date, status=pending) ---
    for days in (1, 3, 7):
        payments = scoped(
            Payment.objects.filter(
                status="pending", due_date=now + timedelta(days=days)
            ).select_related("member", "member__user", "organization")
        )
        for payment in payments:
            member = payment.member
            evaluate(
                "payment_due",
                recipient=getattr(getattr(member, "user", None), "email", None) or "",
                member_name=_display_name(member),
                org_id=payment.organization_id,
                org_name=payment.organization.name if payment.organization else "",
                trigger_date=payment.due_date,
                days=days,
                render_kwargs={
                    "name": getattr(getattr(member, "user", None), "first_name", "") or "",
                    "amount": payment.amount,
                    "invoice": payment.invoice_number,
                    "due_date": payment.due_date or "",
                },
            )

    # --- PT session reminders (sessions scheduled tomorrow) ---
    sessions = scoped(
        PTSession.objects.filter(
            scheduled_date=now + timedelta(days=1), status="scheduled"
        ).select_related("member", "member__user", "trainer", "trainer__user", "organization")
    )
    for session in sessions:
        member = session.member
        trainer_name = (
            session.trainer.user.get_full_name() if session.trainer and session.trainer.user else "Trainer"
        )
        evaluate(
            "pt_session_reminder",
            recipient=getattr(getattr(member, "user", None), "email", None) or "",
            member_name=_display_name(member),
            org_id=session.organization_id,
            org_name=session.organization.name if session.organization else "",
            trigger_date=session.scheduled_date,
            days=1,
            render_kwargs={
                "name": getattr(getattr(member, "user", None), "first_name", "") or "",
                "trainer": trainer_name,
                "date": session.scheduled_date,
                "time": session.scheduled_time,
            },
        )

    rows.sort(key=lambda r: (r["event"], r["days"] or 0, r["member_name"]))
    return rows


def _display_name(member) -> str:
    user = getattr(member, "user", None)
    if user is None:
        return str(getattr(member, "id", ""))
    return user.get_full_name() or user.username
