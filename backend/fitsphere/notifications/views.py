from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from ..core.permissions import IsGymOwnerOrAdmin, IsSuperAdmin
from .models import EmailLog, NotificationPreference, NotificationTemplate
from .predictor import predict_upcoming_sends
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
    serializer_class = EmailLogSerializer
    permission_classes = (IsGymOwnerOrAdmin,)
    filterset_fields = ("status", "recipient")
    ordering = ("-created_at",)

    def get_queryset(self):
        """super_admin sees all orgs; gym_owner/manager see only emails whose
        recipient belongs to their org (EmailLog has no org FK — derive via
        the User table, see audit M5)."""
        user = self.request.user
        qs = EmailLog.objects.all()
        if user.role != "super_admin" and user.organization_id:
            from django.contrib.auth import get_user_model

            org_emails = get_user_model().objects.filter(
                organization_id=user.organization_id
            ).values("email")
            qs = qs.filter(recipient__in=org_emails)
        return qs


class EmailPreviewView(APIView):
    """Read-only prediction of the emails the scheduler will send (and which
    are blocked), computed live from the same filters tasks.py uses."""

    permission_classes = (IsGymOwnerOrAdmin,)

    def get(self, request):
        user = request.user
        org_id = None if user.role == "super_admin" else user.organization_id
        return Response(predict_upcoming_sends(organization_id=org_id))

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
