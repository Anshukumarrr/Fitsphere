from datetime import date

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from ..core.serializers import UserSerializer
from ..memberships.models import MembershipPlan
from .models import Member

User = get_user_model()


class MemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    class Meta:
        model = Member
        fields = (
            "id",
            "user",
            "user_id",
            "gym_code",
            "organization",
            "organization_name",
            "branch",
            "branch_name",
            "date_of_birth",
            "gender",
            "emergency_contact_name",
            "emergency_contact_phone",
            "health_notes",
            "photo",
            "membership_status",
            "membership_start_date",
            "membership_end_date",
            "assigned_trainer",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "gym_code",
            "organization",
            "membership_status",
            "created_at",
            "updated_at",
        )


class MemberCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        write_only=True,
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    email = serializers.EmailField(
        write_only=True,
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False)
    plan = serializers.PrimaryKeyRelatedField(
        queryset=MembershipPlan.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Member
        fields = (
            "branch",
            "date_of_birth",
            "gender",
            "emergency_contact_name",
            "emergency_contact_phone",
            "health_notes",
            "plan",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
        )

    def create(self, validated_data):
        with transaction.atomic():
            plan = validated_data.pop("plan", None)
            user_data = {
                "username": validated_data.pop("username"),
                "email": validated_data.pop("email"),
                "password": validated_data.pop("password"),
                "first_name": validated_data.pop("first_name"),
                "last_name": validated_data.pop("last_name"),
                "phone": validated_data.pop("phone", ""),
            }
            user = User.objects.create_user(**user_data)
            user.role = "member"
            user.organization = self.context["organization"]
            user.save()

            today = date.today()
            membership_start_date = today
            membership_end_date = None
            if plan:
                membership_end_date = date.fromordinal(today.toordinal() + plan.duration_days)

            member = Member.objects.create(
                user=user,
                organization=self.context["organization"],
                created_by=self.context.get("created_by"),
                membership_start_date=membership_start_date,
                membership_end_date=membership_end_date,
                **validated_data,
            )
        return member


class MemberStatusUpdateSerializer(serializers.Serializer):
    membership_status = serializers.ChoiceField(
        choices=Member.MembershipStatus.choices
    )
    membership_end_date = serializers.DateField(required=False)
