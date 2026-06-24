from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Branch, GymOrganization, StaffInvite

User = get_user_model()


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = (
            "id",
            "organization",
            "name",
            "code",
            "contact_email",
            "contact_phone",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "is_active",
            "opening_time",
            "closing_time",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "organization", "created_at", "updated_at")


class GymOrganizationSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True)
    branch_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = GymOrganization
        fields = (
            "id",
            "name",
            "slug",
            "logo",
            "contact_email",
            "contact_phone",
            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",
            "is_active",
            "branches",
            "branch_count",
            "member_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "slug", "created_at", "updated_at")

    def get_branch_count(self, obj):
        return obj.branches.count()

    def get_member_count(self, obj):
        User = get_user_model()
        return User.objects.filter(
            organization=obj, role="member", is_active=True
        ).count()


class StaffInviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffInvite
        fields = (
            "id",
            "organization",
            "branch",
            "email",
            "role",
            "token",
            "status",
            "invited_by",
            "invited_user",
            "created_at",
            "expires_at",
        )
        read_only_fields = (
            "id",
            "token",
            "status",
            "invited_by",
            "created_at",
        )


class StaffInviteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffInvite
        fields = ("email", "role", "branch")

    def create(self, validated_data):
        from django.utils import timezone
        from datetime import timedelta

        validated_data["organization"] = self.context["organization"]
        validated_data["invited_by"] = self.context["request"].user
        validated_data["expires_at"] = timezone.now() + timedelta(days=7)
        return super().create(validated_data)
