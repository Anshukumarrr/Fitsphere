from django.contrib.auth import get_user_model
from django.db import models, transaction
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from ..core.serializers import UserSerializer
from .models import Trainer, TrainerPerformance

User = get_user_model()


class TrainerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    full_name = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()
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
            "branch_name",
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

    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else None

    def get_active_member_count(self, obj):
        if hasattr(obj, "active_member_count") and obj.active_member_count is not None:
            return obj.active_member_count
        return obj.assigned_members.filter(membership_status="active").count()


class TrainerCreateSerializer(serializers.ModelSerializer):
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

    class Meta:
        model = Trainer
        fields = (
            "branch",
            "specialization",
            "bio",
            "qualifications",
            "years_of_experience",
            "hourly_rate",
            "max_members",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
        )

    def create(self, validated_data):
        with transaction.atomic():
            user_data = {
                "username": validated_data.pop("username"),
                "email": validated_data.pop("email"),
                "password": validated_data.pop("password"),
                "first_name": validated_data.pop("first_name"),
                "last_name": validated_data.pop("last_name"),
                "phone": validated_data.pop("phone", ""),
            }
            user = User.objects.create_user(**user_data)
            user.role = "trainer"
            user.organization = self.context["organization"]
            user.save()
            trainer = Trainer.objects.create(
                user=user,
                organization=self.context["organization"],
                created_by=self.context.get("created_by"),
                **validated_data,
            )
        return trainer


class TrainerPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainerPerformance
        fields = "__all__"
        read_only_fields = ("id",)
