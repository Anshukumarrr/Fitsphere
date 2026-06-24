from django.contrib.auth import get_user_model
from rest_framework import serializers

from ..core.serializers import UserSerializer
from .models import Trainer, TrainerPerformance

User = get_user_model()


class TrainerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    full_name = serializers.SerializerMethodField()
    active_member_count = serializers.SerializerMethodField()

    class Meta:
        model = Trainer
        fields = (
            "id",
            "user",
            "user_id",
            "full_name",
            "organization",
            "branch",
            "specialization",
            "bio",
            "qualifications",
            "years_of_experience",
            "is_active",
            "hourly_rate",
            "max_members",
            "active_member_count",
            "session_rating",
            "total_sessions",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "organization",
            "session_rating",
            "total_sessions",
            "created_at",
            "updated_at",
        )

    def get_full_name(self, obj):
        return obj.user.get_full_name()

    def get_active_member_count(self, obj):
        return obj.assigned_members.filter(
            membership_status="active"
        ).count()


class TrainerPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainerPerformance
        fields = "__all__"
        read_only_fields = ("id",)
