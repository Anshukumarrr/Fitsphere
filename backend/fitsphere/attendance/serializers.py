from django.utils import timezone
from rest_framework import serializers

from .models import AttendanceCode, AttendanceLog, QRCode


class QRCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRCode
        fields = ("id", "branch", "code", "is_active", "created_at", "expires_at")
        read_only_fields = ("id", "code", "created_at")


class AttendanceLogSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source="member.user.get_full_name", read_only=True
    )
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = AttendanceLog
        fields = (
            "id",
            "member",
            "member_name",
            "branch",
            "branch_name",
            "trainer",
            "check_in_time",
            "check_in_method",
            "marked_by",
            "session_type",
            "notes",
            "organization",
        )
        read_only_fields = (
            "id",
            "check_in_time",
            "marked_by",
            "organization",
        )


class QRCheckInSerializer(serializers.Serializer):
    qr_code = serializers.UUIDField()
    member_id = serializers.IntegerField()

    def validate(self, data):
        try:
            qr = QRCode.objects.get(code=data["qr_code"], is_active=True)
        except QRCode.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive QR code")
        data["branch"] = qr.branch
        return data


class AttendanceCodeSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    generated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceCode
        fields = (
            "id",
            "organization",
            "branch",
            "branch_name",
            "code",
            "generated_by",
            "generated_by_name",
            "generated_at",
            "expires_at",
            "is_active",
        )
        read_only_fields = (
            "id",
            "organization",
            "code",
            "generated_by",
            "generated_by_name",
            "generated_at",
            "expires_at",
            "is_active",
        )

    def get_generated_by_name(self, obj):
        if obj.generated_by:
            return obj.generated_by.get_full_name() or obj.generated_by.username
        return None


class CodeCheckInSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=5)

    def validate_code(self, value):
        code_obj = AttendanceCode.objects.filter(
            code=value.upper(), is_active=True, expires_at__gt=timezone.now()
        ).first()
        if not code_obj:
            raise serializers.ValidationError("Invalid or expired attendance code")
        return code_obj
