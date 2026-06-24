from rest_framework import generics, permissions, status
from rest_framework.response import Response

from ..core.permissions import IsGymOwnerOrAdmin, IsSuperAdmin
from .models import Branch, GymOrganization, StaffInvite
from .serializers import (
    BranchSerializer,
    GymOrganizationSerializer,
    StaffInviteCreateSerializer,
    StaffInviteSerializer,
)


class SuperAdminOrganizationListView(generics.ListCreateAPIView):
    queryset = GymOrganization.objects.all()
    serializer_class = GymOrganizationSerializer
    permission_classes = (IsSuperAdmin,)
    search_fields = ("name", "contact_email", "city")
    ordering_fields = ("name", "created_at")


class SuperAdminOrganizationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = GymOrganization.objects.all()
    serializer_class = GymOrganizationSerializer
    permission_classes = (IsSuperAdmin,)


class GymOrganizationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = GymOrganizationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user.organization


class BranchListCreateView(generics.ListCreateAPIView):
    serializer_class = BranchSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Branch.objects.all()
        org = user.organization
        if org:
            return Branch.objects.filter(organization=org)
        return Branch.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        org = user.organization
        serializer.save(organization=org)


class BranchDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BranchSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Branch.objects.all()
        org = user.organization
        if org:
            return Branch.objects.filter(organization=org)
        return Branch.objects.none()


class StaffInviteListCreateView(generics.ListCreateAPIView):
    serializer_class = StaffInviteSerializer
    permission_classes = (IsGymOwnerOrAdmin,)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StaffInviteCreateSerializer
        return StaffInviteSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user
        org = user.organization
        context["organization"] = org
        return context

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return StaffInvite.objects.all()
        org = user.organization
        if org:
            return StaffInvite.objects.filter(organization=org)
        return StaffInvite.objects.none()
