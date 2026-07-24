from rest_framework import serializers

from .models import (
    EmailLog,
    NotificationPreference,
    NotificationTemplate,
)


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = "__all__"


class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = "__all__"
        read_only_fields = ("id", "sent_at", "created_at")

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = "__all__"
        read_only_fields = ("id",)
        validators = []  # ponytail: handled by update_or_create in the view
