from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = "super_admin", "Super Admin"
        GYM_OWNER = "gym_owner", "Gym Owner"
        RECEPTIONIST = "receptionist", "Receptionist"
        TRAINER = "trainer", "Trainer"
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "receptionist_profiles"

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


class BaseManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset()

    def for_tenant(self, tenant_id):
        return self.get_queryset().filter(organization_id=tenant_id)
