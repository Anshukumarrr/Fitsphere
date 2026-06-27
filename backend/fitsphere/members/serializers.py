from django.contrib.auth import get_user_model
from rest_framework import serializers

from ..core.serializers import UserSerializer
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
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Member
        fields = (
            "branch",
            "date_of_birth",
            "gender",
            "emergency_contact_name",
            "emergency_contact_phone",
            "health_notes",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
        )

    def create(self, validated_data):
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
        member = Member.objects.create(
            user=user,
            organization=self.context["organization"],
            **validated_data,
        )
        return member


class MemberStatusUpdateSerializer(serializers.Serializer):
    membership_status = serializers.ChoiceField(
        choices=Member.MembershipStatus.choices
    )
    membership_end_date = serializers.DateField(required=False)
