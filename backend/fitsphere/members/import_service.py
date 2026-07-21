import csv
import io
import logging
import re
import datetime
from dataclasses import dataclass, field

import openpyxl
from django.contrib.auth import get_user_model
from django.db import transaction, DatabaseError

from ..memberships.models import MembershipPlan
from ..organizations.models import Branch
from .models import Member

logger = logging.getLogger(__name__)
User = get_user_model()

EXPECTED_COLUMNS = [
    "first_name", "last_name", "email", "phone",
    "gender", "date_of_birth", "whatsapp_number",
    "branch_name", "plan_name",
    "emergency_contact_name", "emergency_contact_phone", "health_notes",
]

REQUIRED_COLUMNS = ["first_name", "last_name", "email"]


@dataclass
class RowError:
    row: int
    field: str
    value: str
    message: str


@dataclass
class ImportResult:
    total: int = 0
    created: int = 0
    skipped: int = 0
    errors: list = field(default_factory=list)


def _clean_username(email: str) -> str:
    local = email.split("@")[0].lower()
    local = re.sub(r"[^a-z0-9_.]", "", local)[:30]
    if not local:
        local = "user"
    base = local
    idx = 1
    while User.objects.filter(username=local).exists():
        local = f"{base}{idx}"
        idx += 1
    return local


def _generate_password() -> str:
    return "admin123"


def _parse_date(value: str) -> datetime.date | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            return datetime.datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            continue
    return None


def _normalize_gender(value: str) -> str:
    v = value.strip().lower() if value else ""
    if v in ("male", "m"):
        return "male"
    if v in ("female", "f"):
        return "female"
    if v in ("other", "o"):
        return "other"
    return ""


def import_members_from_file(file_obj, organization, created_by=None, branch=None) -> ImportResult:
    result = ImportResult()
    content = file_obj.read()

    if file_obj.name and file_obj.name.lower().endswith(".xlsx"):
        rows = _parse_xlsx(content)
    else:
        rows = _parse_csv(content)

    result.total = len(rows)

    branches_by_name = {
        b.name.lower(): b
        for b in Branch.objects.filter(organization=organization, is_active=True)
    }
    plans_by_name = {
        p.name.lower(): p
        for p in MembershipPlan.objects.filter(organization=organization, is_active=True)
    }

    for idx, row_data in enumerate(rows, start=1):
        try:
            _process_row(
                row=idx,
                data=row_data,
                organization=organization,
                created_by=created_by,
                default_branch=branch,
                branches_by_name=branches_by_name,
                plans_by_name=plans_by_name,
                result=result,
            )
        except Exception as e:
            logger.exception("Unexpected error processing row %d", idx)
            result.errors.append(RowError(row=idx, field="", value="", message=str(e)))

    result.skipped = result.total - result.created - len(result.errors)
    return result


def _parse_csv(content: bytes) -> list[dict]:
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    cols = [c.strip().lower().replace(" ", "_") for c in (reader.fieldnames or [])]
    rows = []
    for row in reader:
        normalized = {}
        for raw_key, val in row.items():
            key = raw_key.strip().lower().replace(" ", "_")
            normalized[key] = (val or "").strip()
        rows.append(normalized)
    return rows


def _parse_xlsx(content: bytes) -> list[dict]:
    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True)
    ws = wb.active
    rows_iter = ws.iter_rows(values_only=True)
    header = next(rows_iter, None)
    if not header:
        return []
    cols = [str(c).strip().lower().replace(" ", "_") if c else "" for c in header]
    rows = []
    for row in rows_iter:
        normalized = {}
        for i, val in enumerate(row):
            if i < len(cols):
                normalized[cols[i]] = str(val).strip() if val is not None else ""
        if any(normalized.values()):
            rows.append(normalized)
    return rows


def _send_welcome_email_sync(email: str, first_name: str, username: str, password: str) -> bool:
    from django.core.mail import send_mail, EmailMultiAlternatives, get_connection
    from django.conf import settings

    subject = "Welcome to FitSphere — Your Account is Ready"
    body = (
        f"Hi {first_name},\n\n"
        f"Your FitSphere member account has been created.\n\n"
        f"Username: {username}\n"
        f"Password: {password}\n\n"
        f"Log in at: https://fitsphere.app/login\n\n"
        f"Please change your password after logging in.\n\n"
        f"— FitSphere Team"
    )
    html_body = (
        f"<p>Hi <strong>{first_name}</strong>,</p>"
        f"<p>Your FitSphere member account has been created.</p>"
        f"<table style='background:#1A1D1B;border-radius:8px;padding:20px;margin:16px 0;'>"
        f"<tr><td style='font-size:11px;color:#6B6F6C;text-transform:uppercase;'>Username</td></tr>"
        f"<tr><td style='font-family:monospace;font-size:14px;color:#D4FF3F;padding-bottom:12px;'>{username}</td></tr>"
        f"<tr><td style='font-size:11px;color:#6B6F6C;text-transform:uppercase;'>Password</td></tr>"
        f"<tr><td style='font-family:monospace;font-size:14px;color:#D4FF3F;'>{password}</td></tr>"
        f"</table>"
        f"<p><a href='https://fitsphere.app/login' style='display:inline-block;background:#D4FF3F;color:#0B0D0C;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;'>Log In</a></p>"
        f"<p style='color:#6B6F6C;font-size:12px;'>Please change your password after logging in.</p>"
    )
    try:
        send_mail(
            subject=subject,
            message=body,
            html_message=html_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception:
        if not settings.DEBUG:
            logger.exception("Failed to send welcome email to %s", email)
            return False
        logger.warning("Email backend failed in dev mode, falling back to console for %s", email)
    try:
        conn = get_connection(backend="django.core.mail.backends.console.EmailBackend")
        msg = EmailMultiAlternatives(subject, body, settings.DEFAULT_FROM_EMAIL, [email], connection=conn)
        msg.attach_alternative(html_body, "text/html")
        conn.send_messages([msg])
        return True
    except Exception:
        logger.exception("Console email fallback failed for %s", email)
        return False


def _process_row(row, data, organization, created_by, default_branch,
                 branches_by_name, plans_by_name, result):
    first_name = data.get("first_name", "")
    last_name = data.get("last_name", "")
    email = data.get("email", "")

    missing = [col for col in REQUIRED_COLUMNS if not data.get(col)]
    if missing:
        result.errors.append(RowError(
            row=row, field=", ".join(missing), value="",
            message=f"Missing required field(s): {', '.join(missing)}"
        ))
        return

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        result.errors.append(RowError(row=row, field="email", value=email, message="Invalid email format"))
        return

    if User.objects.filter(email=email).exists():
        result.errors.append(RowError(row=row, field="email", value=email, message="Email already registered"))
        return

    username = _clean_username(email)
    password = _generate_password()

    gender = _normalize_gender(data.get("gender", ""))
    dob = _parse_date(data.get("date_of_birth", ""))
    phone = data.get("phone", "")
    whatsapp = data.get("whatsapp_number", "")

    branch_name_raw = data.get("branch_name", "")
    matched_branch = None
    if branch_name_raw:
        matched_branch = branches_by_name.get(branch_name_raw.strip().lower())
    if not matched_branch:
        matched_branch = default_branch

    plan_name_raw = data.get("plan_name", "")
    matched_plan = None
    if plan_name_raw:
        matched_plan = plans_by_name.get(plan_name_raw.strip().lower())

    emergency_contact_name = data.get("emergency_contact_name", "")
    emergency_contact_phone = data.get("emergency_contact_phone", "")
    health_notes = data.get("health_notes", "")

    email_sent = _send_welcome_email_sync(email, first_name, username, password)
    if not email_sent:
        result.errors.append(RowError(row=row, field="email", value=email, message="Failed to send welcome email — member not created"))
        return

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                role="member",
                organization=organization,
            )

            today = datetime.date.today()
            membership_start_date = today
            membership_end_date = None
            if matched_plan:
                membership_end_date = datetime.date.fromordinal(today.toordinal() + matched_plan.duration_days)

            Member.objects.create(
                user=user,
                organization=organization,
                branch=matched_branch,
                created_by=created_by,
                date_of_birth=dob,
                gender=gender,
                whatsapp_number=whatsapp,
                emergency_contact_name=emergency_contact_name,
                emergency_contact_phone=emergency_contact_phone,
                health_notes=health_notes,
                membership_start_date=membership_start_date,
                membership_end_date=membership_end_date,
            )
    except DatabaseError as e:
        result.errors.append(RowError(row=row, field="", value="", message=f"Database error: {e}"))
        return

    result.created += 1
    logger.info("Imported member %s (%s) from row %d", username, email, row)
