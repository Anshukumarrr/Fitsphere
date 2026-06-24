from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(
        source="user.get_full_name", read_only=True
    )
    organization_name = serializers.CharField(
        source="organization.name", read_only=True
    )

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "organization",
            "organization_name",
            "user",
            "user_name",
            "action",
            "entity_type",
            "entity_id",
            "details",
            "ip_address",
            "timestamp",
        )
        read_only_fields = fields
