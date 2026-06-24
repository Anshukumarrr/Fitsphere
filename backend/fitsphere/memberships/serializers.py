from rest_framework import serializers

from .models import MembershipPlan, MemberMembership, MembershipRenewal


class MembershipPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipPlan
        fields = (
            "id",
            "organization",
            "name",
            "description",
            "duration",
            "duration_days",
            "price",
            "billing_cycle",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "organization", "created_at", "updated_at")


class MemberMembershipSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    member_name = serializers.CharField(
        source="member.user.get_full_name", read_only=True
    )

    class Meta:
        model = MemberMembership
        fields = (
            "id",
            "member",
            "member_name",
            "plan",
            "plan_name",
            "start_date",
            "end_date",
            "is_active",
            "is_frozen",
            "freeze_start",
            "freeze_end",
            "amount_paid",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class MembershipRenewalSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipRenewal
        fields = "__all__"
        read_only_fields = ("id", "renewed_at")
