from datetime import timedelta
from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from .models import EmailLog, NotificationPreference, NotificationTemplate
from .predictor import predict_upcoming_sends
from .services import EmailService


class EmailServiceDedupTests(TestCase):
    """H1: identical emails (same recipient+subject+body) must not re-send
    within the dedup window. Proven bug: 4 duplicate "Membership Expiring
    Soon" emails within 51 min on 07-28 (double-triggered scheduler runs)."""

    def setUp(self):
        self.service = EmailService()
        self.recipient = "dup-test@example.com"
        self.subject = "Membership Expiring Soon"
        self.body = "Hi Anshu, your membership ends in 7 days."

    @patch("fitsphere.notifications.services.send_mail")
    def test_first_send_creates_sent_log(self, mock_send_mail):
        log = self.service.send(self.recipient, self.subject, self.body)
        mock_send_mail.assert_called_once()
        log.refresh_from_db()
        self.assertEqual(log.status, EmailLog.Status.SENT)
        self.assertIsNotNone(log.sent_at)

    @patch("fitsphere.notifications.services.send_mail")
    def test_identical_resend_within_window_suppressed(self, mock_send_mail):
        first = self.service.send(self.recipient, self.subject, self.body)
        second = self.service.send(self.recipient, self.subject, self.body)
        # Exactly one physical send and one log row; the duplicate returns the
        # original SENT log (callers keep a valid EmailLog).
        mock_send_mail.assert_called_once()
        self.assertEqual(second.id, first.id)
        self.assertEqual(EmailLog.objects.filter(recipient=self.recipient).count(), 1)

    @patch("fitsphere.notifications.services.send_mail")
    def test_different_body_sends_again(self, mock_send_mail):
        """One static subject per event serves many legitimately different
        emails (7/3/1-day reminders, consecutive PT sessions, multiple
        invoices) — the body must be part of the dedup key."""
        self.service.send(self.recipient, self.subject, self.body)
        self.service.send(
            self.recipient,
            self.subject,
            "Hi Anshu, your membership ends in 3 days.",
        )
        self.assertEqual(mock_send_mail.call_count, 2)
        self.assertEqual(EmailLog.objects.filter(recipient=self.recipient).count(), 2)

    @patch("fitsphere.notifications.services.send_mail")
    def test_failed_log_never_blocks_a_later_send(self, mock_send_mail):
        """A FAILED attempt must not suppress the next trigger's retry — only
        SENT rows count as proof of delivery."""
        EmailLog.objects.create(
            recipient=self.recipient,
            subject=self.subject,
            body=self.body,
            status=EmailLog.Status.FAILED,
        )
        log = self.service.send(self.recipient, self.subject, self.body)
        mock_send_mail.assert_called_once()
        log.refresh_from_db()
        self.assertEqual(log.status, EmailLog.Status.SENT)

    @patch("fitsphere.notifications.services.send_mail")
    def test_sent_outside_window_sends_again(self, mock_send_mail):
        """A send older than the window is a different day's legit reminder
        (7/3/1-day cadence) — it must fire."""
        EmailLog.objects.create(
            recipient=self.recipient,
            subject=self.subject,
            body=self.body,
            status=EmailLog.Status.SENT,
            sent_at=timezone.now() - timedelta(hours=self.service.DEDUP_WINDOW_HOURS + 1),
        )
        self.service.send(self.recipient, self.subject, self.body)
        mock_send_mail.assert_called_once()

    @patch("fitsphere.notifications.services.send_mail")
    def test_double_task_run_sends_once(self, mock_send_mail):
        """End-to-end 07-28 scenario: check_membership_expiry() firing twice in
        the same day must produce exactly one email (restart/manual overlap)."""
        from django.contrib.auth import get_user_model

        from fitsphere.members.models import Member
        from fitsphere.memberships.models import MemberMembership
        from fitsphere.notifications.tasks import check_membership_expiry
        from fitsphere.organizations.models import GymOrganization

        User = get_user_model()
        org = GymOrganization.objects.create(name="Dedup Gym", slug="dedup")
        user = User.objects.create_user(
            username="dup_member", password="pass", organization=org,
            role="member", email=self.recipient,
        )
        member = Member.objects.create(user=user, organization=org)
        MemberMembership.objects.create(
            member=member, organization=org, plan=None,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=7),
            is_active=True, amount_paid=1000,
        )
        NotificationTemplate.objects.create(
            name="Expiry", event="membership_expiry", channel="email",
            subject=self.subject,
            body_template="Hi {name}, your membership ends on {end_date} ({days} days left).",
            is_active=True,
        )
        NotificationPreference.objects.create(
            organization=org, event="membership_expiry",
            channel="email", enabled=True,
        )

        check_membership_expiry()
        check_membership_expiry()

        self.assertEqual(mock_send_mail.call_count, 1)
        sent = EmailLog.objects.filter(recipient=self.recipient, status=EmailLog.Status.SENT)
        self.assertEqual(sent.count(), 1)


class PredictorTests(TestCase):
    """Email Center preview: predict_upcoming_sends mirrors tasks.py gates so
    the UI shows exactly what will fire (and why anything won't)."""

    def setUp(self):
        from django.contrib.auth import get_user_model

        from fitsphere.members.models import Member
        from fitsphere.memberships.models import MemberMembership
        from fitsphere.organizations.models import GymOrganization

        User = get_user_model()
        self.org = GymOrganization.objects.create(name="Pred Gym", slug="pred")
        self.user = User.objects.create_user(
            username="pred_member", password="pass", organization=self.org,
            role="member", email="pred@example.com",
        )
        self.member = Member.objects.create(user=self.user, organization=self.org)
        self.membership = MemberMembership.objects.create(
            member=self.member, organization=self.org, plan=None,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=7),
            is_active=True, amount_paid=1000,
        )
        self.template = NotificationTemplate.objects.create(
            name="Expiry", event="membership_expiry", channel="email",
            subject="Membership Expiring Soon",
            body_template="Hi {name}, your membership ends on {end_date} ({days} days left).",
            is_active=True,
        )

    def _predicted(self, org_id=None):
        rows = predict_upcoming_sends(organization_id=org_id)
        return [r for r in rows if r["event"] == "membership_expiry"]

    def test_will_send_when_pref_on(self):
        NotificationPreference.objects.create(
            organization=self.org, event="membership_expiry", channel="email", enabled=True,
        )
        rows = self._predicted(self.org.id)
        self.assertTrue(any(r["status"] == "will_send" for r in rows))

    def test_blocked_pref_when_off(self):
        rows = self._predicted(self.org.id)
        self.assertTrue(any(r["status"] == "blocked_pref" for r in rows))

    def test_blocked_template_when_missing(self):
        NotificationPreference.objects.create(
            organization=self.org, event="membership_expiry", channel="email", enabled=True,
        )
        self.template.delete()
        rows = self._predicted(self.org.id)
        self.assertTrue(any(r["status"] == "blocked_template" for r in rows))

    def test_suppressed_dedup_when_already_sent(self):
        NotificationPreference.objects.create(
            organization=self.org, event="membership_expiry", channel="email", enabled=True,
        )
        body = self.template.body_template.format(
            name="", plan="Membership", end_date=self.membership.end_date, days=7,
        )
        EmailLog.objects.create(
            recipient="pred@example.com", subject=self.template.subject,
            body=body, status=EmailLog.Status.SENT,
            sent_at=timezone.now(),
        )
        rows = self._predicted(self.org.id)
        self.assertTrue(any(r["status"] == "suppressed_dedup" for r in rows))

    def test_org_scoping(self):
        from django.contrib.auth import get_user_model

        from fitsphere.members.models import Member
        from fitsphere.memberships.models import MemberMembership
        from fitsphere.organizations.models import GymOrganization

        User = get_user_model()
        other_org = GymOrganization.objects.create(name="Other Gym", slug="other-pred")
        other_user = User.objects.create_user(
            username="pred_member2", password="pass", organization=other_org,
            role="member", email="pred2@example.com",
        )
        other_member = Member.objects.create(user=other_user, organization=other_org)
        MemberMembership.objects.create(
            member=other_member, organization=other_org, plan=None,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=7),
            is_active=True, amount_paid=1000,
        )
        NotificationPreference.objects.create(
            organization=self.org, event="membership_expiry", channel="email", enabled=True,
        )
        NotificationPreference.objects.create(
            organization=other_org, event="membership_expiry", channel="email", enabled=True,
        )

        all_rows = self._predicted(None)  # super_admin: all orgs
        self.assertEqual({r["org_id"] for r in all_rows}, {self.org.id, other_org.id})

        org_rows = self._predicted(self.org.id)  # owner: own org only
        self.assertTrue(org_rows)
        self.assertEqual({r["org_id"] for r in org_rows}, {self.org.id})


class TemplateValidationTests(TestCase):
    """H4: a placeholder typo in a scheduler template silently kills the event
    (tasks._render returns None -> caller continues). Save-time validation."""

    def test_typo_placeholder_raises(self):
        template = NotificationTemplate(
            name="Expiry", event="membership_expiry", channel="email",
            subject="Expiring Soon",
            body_template="Hi {nmae}, your membership ends on {end_date}.",
            is_active=True,
        )
        with self.assertRaises(ValidationError):
            template.full_clean()

    def test_valid_placeholders_pass(self):
        template = NotificationTemplate(
            name="Expiry", event="membership_expiry", channel="email",
            subject="Expiring Soon",
            body_template="Hi {name}, {plan} ends {end_date} ({days} days left).",
            is_active=True,
        )
        template.full_clean()  # must not raise

    def test_non_scheduler_event_unconstrained(self):
        template = NotificationTemplate(
            name="Welcome", event="welcome", channel="email",
            subject="Welcome", body_template="Hi {anything_goes}!", is_active=True,
        )
        template.full_clean()  # must not raise


class ImportWelcomeDedupTests(TestCase):
    """Bulk-import credential emails used raw send_mail (bypassing the H1
    guard) — re-importing the same CSV sent duplicate welcome emails. Now
    routed through EmailService: deduped + logged."""

    @patch("fitsphere.notifications.services.send_mail")
    def test_double_import_sends_once(self, mock_send_mail):
        from fitsphere.members.import_service import _send_welcome_email_sync

        ok1 = _send_welcome_email_sync("welcome-dup@example.com", "Test", "user1", "pass1")
        ok2 = _send_welcome_email_sync("welcome-dup@example.com", "Test", "user1", "pass1")

        self.assertTrue(ok1)
        self.assertTrue(ok2)  # second call deduped but still reports success
        self.assertEqual(mock_send_mail.call_count, 1)
        self.assertEqual(
            EmailLog.objects.filter(recipient="welcome-dup@example.com").count(), 1
        )

    @patch("fitsphere.notifications.services.send_mail")
    def test_different_credentials_send_twice(self, mock_send_mail):
        from fitsphere.members.import_service import _send_welcome_email_sync

        _send_welcome_email_sync("welcome-dup@example.com", "Test", "user1", "pass1")
        _send_welcome_email_sync("welcome-dup@example.com", "Test", "user2", "pass2")

        # Body differs (credentials inside) -> legitimately different email
        self.assertEqual(mock_send_mail.call_count, 2)
        self.assertEqual(
            EmailLog.objects.filter(recipient="welcome-dup@example.com").count(), 2
        )
