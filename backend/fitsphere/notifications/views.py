from rest_framework import generics

from ..core.permissions import IsGymOwnerOrAdmin, IsSuperAdmin
from .models import EmailLog, NotificationPreference, NotificationTemplate, WhatsAppMessageLog
from .serializers import (
    EmailLogSerializer,
    NotificationPreferenceSerializer,
    NotificationTemplateSerializer,
    WhatsAppMessageLogSerializer,
)


class NotificationTemplateListView(generics.ListAPIView):
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = (IsSuperAdmin,)


class EmailLogListView(generics.ListAPIView):
    queryset = EmailLog.objects.all()
    serializer_class = EmailLogSerializer
    permission_classes = (IsSuperAdmin,)
    filterset_fields = ("status", "recipient")
    ordering = ("-created_at",)


class WhatsAppMessageLogListView(generics.ListAPIView):
    queryset = WhatsAppMessageLog.objects.all()
    serializer_class = WhatsAppMessageLogSerializer
    permission_classes = (IsSuperAdmin,)
    filterset_fields = ("status", "event")
    ordering = ("-created_at",)


class NotificationPreferenceListUpdateView(generics.ListCreateAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    serializer_class = NotificationPreferenceSerializer

    def get_queryset(self):
        return NotificationPreference.objects.filter(
            organization=self.request.user.organization
        )

    def perform_create(self, serializer):
        NotificationPreference.objects.update_or_create(
            organization=self.request.user.organization,
            event=serializer.validated_data["event"],
            channel=serializer.validated_data["channel"],
            defaults={"enabled": serializer.validated_data["enabled"]},
        )
