import secrets
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db import models


class GymOrganization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    logo = models.ImageField(upload_to="org_logos/", blank=True, null=True)
    # Gym public-profile fields (Cloudinary-backed). public_ids are stored and
    # the serializer builds optimized delivery URLs from them.
    owner_name = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    banner_public_id = models.CharField(max_length=255, blank=True)
    picture_public_id = models.CharField(max_length=255, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True, default="IN")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    subscription = models.OneToOneField(
        "billing.Subscription",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="organization_subscription",
    )

    class Meta:
        db_table = "gym_organizations"
        verbose_name = "Gym Organization"
        verbose_name_plural = "Gym Organizations"

    def __str__(self):
        return self.name


class Branch(models.Model):
    organization = models.ForeignKey(
        GymOrganization, on_delete=models.CASCADE, related_name="branches"
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True, default="IN")
    is_active = models.BooleanField(default=True)
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "branches"
        unique_together = ("organization", "name")

    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class StaffInvite(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    organization = models.ForeignKey(
        GymOrganization, on_delete=models.CASCADE, related_name="staff_invites"
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_invites",
    )
    email = models.EmailField()
    role = models.CharField(max_length=20)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_invites",
    )
    invited_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_invites",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "staff_invites"

    def __str__(self):
        return f"Invite {self.email} -> {self.role} at {self.organization.name}"


class InviteCode(models.Model):
    """Daily-rotating signup code, scoped to an organization + branch.

    Staff self-register with the gym owner's code; members self-register with
    the code shown on trainer/receptionist/manager dashboards. Codes are valid
    for one IST calendar day and rotate at 00:01 IST — generated lazily on
    fetch (``get_current``) and pre-created daily by the scheduler
    (``rotate_all``) so a missed tick can never serve yesterday's code.
    """

    class Kind(models.TextChoices):
        STAFF = "staff", "Staff"
        MEMBER = "member", "Member"

    # No 0/O/1/I/L — codes are dictated verbally at the front desk.
    CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    CODE_LENGTH = 6

    organization = models.ForeignKey(
        GymOrganization, on_delete=models.CASCADE, related_name="invite_codes"
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="invite_codes"
    )
    kind = models.CharField(max_length=10, choices=Kind.choices)
    code = models.CharField(max_length=CODE_LENGTH, unique=True)
    valid_for = models.DateField(help_text="IST calendar date this code works on")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "invite_codes"
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "branch", "kind", "valid_for"],
                name="uniq_invite_code_per_branch_kind_day",
            )
        ]

    def __str__(self):
        return f"{self.kind} code {self.code} ({self.organization.name} / {self.branch.name})"

    @staticmethod
    def today_ist():
        return datetime.now(ZoneInfo("Asia/Kolkata")).date()

    @classmethod
    def _generate_code(cls):
        alphabet = cls.CODE_ALPHABET
        while True:
            candidate = "".join(
                secrets.choice(alphabet) for _ in range(cls.CODE_LENGTH)
            )
            if not cls.objects.filter(code=candidate).exists():
                return candidate

    @classmethod
    def get_current(cls, organization, branch, kind, for_date=None):
        """Return the code valid today for (org, branch, kind), generating it if missing."""
        day = for_date or cls.today_ist()
        code, _ = cls.objects.get_or_create(
            organization=organization,
            branch=branch,
            kind=kind,
            valid_for=day,
            defaults={"code": cls._generate_code()},
        )
        return code

    @classmethod
    def rotate_all(cls):
        """Ensure every active org/branch/kind combo has a code for today.

        Called by the daily 00:01 IST scheduler job; ``get_current`` is the
        lazy fallback when the job misses a tick (Render free tier).
        """
        day = cls.today_ist()
        created = 0
        for org in GymOrganization.objects.filter(is_active=True):
            for branch in org.branches.filter(is_active=True):
                for kind in cls.Kind.values:
                    _, was_created = cls.objects.get_or_create(
                        organization=org,
                        branch=branch,
                        kind=kind,
                        valid_for=day,
                        defaults={"code": cls._generate_code()},
                    )
                    created += int(was_created)
        return created
