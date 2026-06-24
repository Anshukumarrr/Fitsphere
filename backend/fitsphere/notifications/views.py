from rest_framework import generics

from ..core.permissions import IsGymOwnerOrAdmin, IsSuperAdmin
from .models import EmailLog, NotificationPreference, NotificationTemplate
from .serializers import (
    EmailLogSerializer,
    NotificationPreferenceSerializer,
    NotificationTemplateSerializer,
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


class NotificationPreferenceListUpdateView(generics.ListCreateAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    serializer_class = NotificationPreferenceSerializer

    def get_queryset(self):
        return NotificationPreference.objects.filter(
            organization=self.request.user.organization
        )

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)
