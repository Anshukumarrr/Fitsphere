import uuid

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from ..organizations.serializers import BranchSerializer as OrgBranchSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    gym_code = serializers.SerializerMethodField()
    membership_plan = serializers.SerializerMethodField()
    membership_expiry = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "photo",
            "role",
            "is_active",
            "gym_code",
            "membership_plan",
            "membership_expiry",
            "organization",
        )
        read_only_fields = ("id", "role", "is_active")

    def get_gym_code(self, obj):
        profile = getattr(obj, "member_profile", None)
        return profile.gym_code if profile else None

    def get_membership_plan(self, obj):
        profile = getattr(obj, "member_profile", None)
        if profile:
            active = profile.memberships.filter(is_active=True).first()
            return active.plan.name if active and active.plan else None
        return None

    def get_membership_expiry(self, obj):
        profile = getattr(obj, "member_profile", None)
        return profile.membership_end_date if profile else None


class GymOrganizationSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    slug = serializers.SlugField(read_only=True)
    city = serializers.CharField(read_only=True)
    state = serializers.CharField(read_only=True)
    contact_email = serializers.EmailField(read_only=True)
    contact_phone = serializers.CharField(read_only=True)


class BranchSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    city = serializers.CharField(read_only=True)
    opening_time = serializers.TimeField(read_only=True)
    closing_time = serializers.TimeField(read_only=True)


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)

    gym_name = serializers.CharField()
    gym_city = serializers.CharField(required=False, allow_blank=True)
    gym_state = serializers.CharField(required=False, allow_blank=True)
    gym_address = serializers.CharField(required=False, allow_blank=True)
    gym_phone = serializers.CharField(required=False, allow_blank=True)
    gym_email = serializers.EmailField(required=False, allow_blank=True)

    branch_name = serializers.CharField()
    branch_city = serializers.CharField(required=False, allow_blank=True)
    opening_time = serializers.TimeField(required=False, allow_null=True)
    closing_time = serializers.TimeField(required=False, allow_null=True)

    def create(self, validated_data):
        from ..organizations.models import Branch, GymOrganization

        with transaction.atomic():
            gym_name = validated_data.pop("gym_name")
            gym_city = validated_data.pop("gym_city", "")
            gym_state = validated_data.pop("gym_state", "")
            gym_address = validated_data.pop("gym_address", "")
            gym_phone = validated_data.pop("gym_phone", "")
            gym_email = validated_data.pop("gym_email", "")

            branch_name = validated_data.pop("branch_name")
            branch_city = validated_data.pop("branch_city", "")
            opening_time = validated_data.pop("opening_time", None)
            closing_time = validated_data.pop("closing_time", None)

            user = User.objects.create_user(**validated_data)
            user.role = "gym_owner"
            user.is_active = False
            user.save()

            base_slug = slugify(gym_name)[:50]
            slug = base_slug
            if GymOrganization.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

            org = GymOrganization.objects.create(
                name=gym_name,
                slug=slug,
                city=gym_city,
                state=gym_state,
                address_line1=gym_address,
                contact_phone=gym_phone or validated_data.get("phone", ""),
                contact_email=gym_email or validated_data.get("email", ""),
            )

            Branch.objects.create(
                organization=org,
                name=branch_name,
                city=branch_city or gym_city,
                address_line1=gym_address,
                contact_phone=gym_phone or validated_data.get("phone", ""),
                contact_email=gym_email or validated_data.get("email", ""),
                opening_time=opening_time,
                closing_time=closing_time,
            )

            user.organization = org
            user.save(update_fields=["organization"])

        user._gym_organization = org
        return user

    def to_representation(self, instance):
        user_data = UserSerializer(instance).data
        org = getattr(instance, "_gym_organization", None) or getattr(instance, "organization", None)
        if org:
            user_data["organization"] = GymOrganizationSerializer(org).data
            first_branch = org.branches.first()
            if first_branch:
                user_data["branch"] = BranchSerializer(first_branch).data
        return user_data


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class ReceptionistCreateSerializer(serializers.Serializer):
    username = serializers.CharField(
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    branch_id = serializers.IntegerField(required=False, allow_null=True)

    def create(self, validated_data):
        with transaction.atomic():
            branch_id = validated_data.pop("branch_id", None)
            user = User.objects.create_user(
                username=validated_data.pop("username"),
                email=validated_data.pop("email"),
                password=validated_data.pop("password"),
                first_name=validated_data.pop("first_name"),
                last_name=validated_data.pop("last_name"),
                phone=validated_data.pop("phone", ""),
            )
            user.role = "receptionist"
            user.organization = self.context.get("organization")
            user.save()

            from .models import ReceptionistProfile
            profile = ReceptionistProfile.objects.create(
                user=user,
                branch_id=branch_id,
                created_by=self.context.get("created_by"),
            )
        return profile


class StaffSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    user = UserSerializer()
    full_name = serializers.CharField()
    role = serializers.CharField()
    branch = serializers.IntegerField(allow_null=True)
    branch_name = serializers.CharField(allow_null=True)
    branch_details = OrgBranchSerializer(allow_null=True)
    is_active = serializers.BooleanField()
    profile_id = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    specialization = serializers.CharField(allow_null=True, default=None)
    years_of_experience = serializers.IntegerField(allow_null=True, default=None)
    hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True, default=None)
    max_members = serializers.IntegerField(allow_null=True, default=None)
    session_rating = serializers.DecimalField(max_digits=3, decimal_places=2, allow_null=True, default=None)
    total_sessions = serializers.IntegerField(allow_null=True, default=None)
    active_member_count = serializers.IntegerField(allow_null=True, default=None)
    bio = serializers.CharField(allow_null=True, default=None)
    qualifications = serializers.CharField(allow_null=True, default=None)


class StaffCreateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=["trainer", "receptionist", "cleaner", "manager", "security", "instructor", "maintenance"]
    )
    username = serializers.CharField(
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    branch_id = serializers.IntegerField(required=False, allow_null=True)

    specialization = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    qualifications = serializers.CharField(required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, allow_null=True)
    max_members = serializers.IntegerField(required=False, allow_null=True)

    def create(self, validated_data):
        from .models import (
            CleanerProfile,
            InstructorProfile,
            MaintenanceProfile,
            ManagerProfile,
            ReceptionistProfile,
            SecurityProfile,
        )
        from ..trainers.models import Trainer

        role = validated_data.pop("role")
        branch_id = validated_data.pop("branch_id", None)

        trainer_fields = {}
        for field in ["specialization", "bio", "qualifications", "years_of_experience", "hourly_rate", "max_members"]:
            val = validated_data.pop(field, None)
            if val not in (None, ""):
                trainer_fields[field] = val

        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data.pop("username"),
                email=validated_data.pop("email"),
                password=validated_data.pop("password"),
                first_name=validated_data.pop("first_name"),
                last_name=validated_data.pop("last_name"),
                phone=validated_data.pop("phone", ""),
            )
            user.role = role
            user.organization = self.context.get("organization")
            user.save()

            created_by = self.context.get("created_by")

            profile_map = {
                "trainer": (Trainer, {"organization": self.context.get("organization"), **trainer_fields}),
                "receptionist": (ReceptionistProfile, {}),
                "cleaner": (CleanerProfile, {}),
                "manager": (ManagerProfile, {}),
                "security": (SecurityProfile, {}),
                "instructor": (InstructorProfile, {}),
                "maintenance": (MaintenanceProfile, {}),
            }

            model_class, extra_fields = profile_map[role]
            profile = model_class.objects.create(
                user=user,
                branch_id=branch_id,
                created_by=created_by,
                **extra_fields,
            )

        return profile
