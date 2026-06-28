from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
        )

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
