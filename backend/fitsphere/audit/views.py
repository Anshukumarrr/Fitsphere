from rest_framework import generics

from ..core.permissions import IsGymOwnerOrAdmin, IsSuperAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


class SuperAdminAuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.select_related("user", "organization").all()
    serializer_class = AuditLogSerializer
    permission_classes = (IsSuperAdmin,)
    filterset_fields = ("action", "entity_type", "organization")
    ordering = ("-timestamp",)


class OrgAuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = (IsGymOwnerOrAdmin,)

    def get_queryset(self):
        return AuditLog.objects.select_related("user").filter(
            organization=self.request.user.organization
        )
