from rest_framework import serializers

from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    raised_by_name = serializers.SerializerMethodField()
    raised_by_role = serializers.CharField(source="raised_by.role", read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    resolved_by_name = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()
    can_resolve = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = (
            "id",
            "organization",
            "organization_name",
            "raised_by",
            "raised_by_name",
            "raised_by_role",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "assigned_to",
            "assigned_to_name",
            "resolved_by",
            "resolved_by_name",
            "resolution_notes",
            "can_resolve",
            "created_at",
            "updated_at",
            "resolved_at",
        )
        read_only_fields = (
            "id",
            "raised_by",
            "raised_by_name",
            "raised_by_role",
            "assigned_to_name",
            "resolved_by",
            "resolved_by_name",
            "can_resolve",
            "created_at",
            "updated_at",
            "resolved_at",
        )

    def get_raised_by_name(self, obj):
        return obj.raised_by.get_full_name() or obj.raised_by.username

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return obj.resolved_by.get_full_name() or obj.resolved_by.username
        return None

    def get_organization_name(self, obj):
        return obj.organization.name if obj.organization else None

    def get_can_resolve(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        user = request.user
        if obj.status in ("resolved", "closed"):
            return False
        if user.role == "super_admin":
            return obj.raised_by.role == "gym_owner"
        if user.role == "gym_owner":
            return obj.raised_by.role in ("member", "trainer") and (
                not obj.organization or obj.organization_id == user.organization_id
            )
        if user.role == "trainer":
            return obj.raised_by.role == "member" and (
                not obj.organization or obj.organization_id == user.organization_id
            )
        return False


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ("title", "description", "category", "priority")

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        validated_data["raised_by"] = user
        if user.organization_id:
            validated_data["organization_id"] = user.organization_id
        return super().create(validated_data)


class TicketUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ("status", "assigned_to", "resolution_notes", "resolved_by", "resolved_at")
        read_only_fields = ("resolved_by", "resolved_at")
