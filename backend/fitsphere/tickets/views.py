from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from ..core.permissions import HasRole, TICKET_ELIGIBLE_ROLES
from .models import Ticket
from .serializers import (
    TicketCreateSerializer,
    TicketSerializer,
    TicketUpdateSerializer,
)


class TicketListCreateView(generics.ListCreateAPIView):
    serializer_class = TicketSerializer

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TicketCreateSerializer
        return TicketSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), HasRole(*TICKET_ELIGIBLE_ROLES)]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Ticket.objects.select_related(
            "raised_by", "assigned_to", "resolved_by", "organization"
        )

        if user.role == "super_admin":
            return qs.all()

        if user.role == "gym_owner":
            return qs.filter(
                raised_by__organization_id=user.organization_id
            ) | qs.filter(raised_by=user)

        if user.role in ("trainer", "manager"):
            return qs.filter(
                raised_by__organization_id=user.organization_id,
                raised_by__role="member",
            ) | qs.filter(raised_by=user)

        if user.role in ("member", "instructor", "security", "cleaner", "maintenance"):
            return qs.filter(raised_by=user)

        return qs.none()


class TicketDetailView(generics.RetrieveUpdateAPIView):
    queryset = Ticket.objects.select_related(
        "raised_by", "assigned_to", "resolved_by", "organization"
    )
    serializer_class = TicketSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return TicketUpdateSerializer
        return TicketSerializer

    def perform_update(self, serializer):
        user = self.request.user
        validated_data = serializer.validated_data
        status_val = validated_data.get("status")
        ticket = self.get_object()

        if status_val in ("resolved", "closed"):
            can_resolve = self._can_resolve(user, ticket)
            if not can_resolve:
                raise PermissionDenied("You do not have permission to resolve this ticket")
            validated_data["resolved_by"] = user
            validated_data["resolved_at"] = timezone.now()

        serializer.save()

    def _can_resolve(self, user, ticket):
        if ticket.status in ("resolved", "closed"):
            return False
        if user.role == "super_admin":
            return ticket.raised_by.role == "gym_owner"
        if user.role == "gym_owner":
            return ticket.raised_by.role in ("member", "trainer") and (
                not ticket.organization or ticket.organization_id == user.organization_id
            )
        if user.role == "trainer":
            return ticket.raised_by.role == "member" and (
                not ticket.organization or ticket.organization_id == user.organization_id
            )
        if user.role == "manager":
            return ticket.raised_by.role in ("member", "trainer") and (
                not ticket.organization or ticket.organization_id == user.organization_id
            )
        return False
