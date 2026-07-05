from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = "super_admin", "Super Admin"
        GYM_OWNER = "gym_owner", "Gym Owner"
        RECEPTIONIST = "receptionist", "Receptionist"
        TRAINER = "trainer", "Trainer"
        CLEANER = "cleaner", "Cleaner"
        MANAGER = "manager", "Manager"
        SECURITY = "security", "Security"
        INSTRUCTOR = "instructor", "Instructor"
        MAINTENANCE = "maintenance", "Maintenance"
        MEMBER = "member", "Member"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    phone = models.CharField(max_length=20, blank=True)
    photo = models.ImageField(upload_to="user_photos/", blank=True, null=True)
    organization = models.ForeignKey(
        "organizations.GymOrganization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class ReceptionistProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="receptionist_profile",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        related_name="receptionists",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_receptionists",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "receptionist_profiles"

    def __str__(self):
        return f"{self.user.username} @ {self.branch}"


class CleanerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cleaner_profile",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cleaners",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_cleaners",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cleaner_profiles"

    def __str__(self):
        return f"{self.user.username} @ {self.branch}"


class ManagerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="manager_profile",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managers",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_managers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "manager_profiles"

    def __str__(self):
        return f"{self.user.username} @ {self.branch}"


class SecurityProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="security_profile",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="security_staff",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_security",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "security_profiles"

    def __str__(self):
        return f"{self.user.username} @ {self.branch}"


class InstructorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="instructor_profile",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="instructors",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_instructors",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "instructor_profiles"

    def __str__(self):
        return f"{self.user.username} @ {self.branch}"


class MaintenanceProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="maintenance_profile",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="maintenance_staff",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_maintenance",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "maintenance_profiles"

    def __str__(self):
        return f"{self.user.username} @ {self.branch}"


class TenantAwareModel(models.Model):
    organization = models.ForeignKey(
        "organizations.GymOrganization",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        from fitsphere.organizations.models import GymOrganization
        if not self.organization_id:
            tenant_id = getattr(self, "_tenant_id", None)
            if tenant_id:
                self.organization_id = tenant_id
        super().save(*args, **kwargs)


class EmailVerificationToken(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_token",
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "email_verification_tokens"

    def is_expired(self):
        expiry = self.created_at + timezone.timedelta(hours=24)
        return timezone.now() > expiry
