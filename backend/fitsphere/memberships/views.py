from rest_framework import generics, permissions

from ..core.permissions import IsGymOwnerOrAdmin, IsStaff
from .models import MembershipPlan, MemberMembership
from .serializers import MembershipPlanSerializer, MemberMembershipSerializer


class MembershipPlanListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsStaff,)
    serializer_class = MembershipPlanSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permission() for permission in (IsGymOwnerOrAdmin,)]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return MembershipPlan.objects.all()
        return MembershipPlan.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class MembershipPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsStaff,)
    serializer_class = MembershipPlanSerializer

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [permission() for permission in (IsGymOwnerOrAdmin,)]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return MembershipPlan.objects.all()
        return MembershipPlan.objects.filter(organization=user.organization)


class MemberMembershipListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsStaff,)
    serializer_class = MemberMembershipSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return MemberMembership.objects.select_related(
                "member", "plan", "member__user"
            ).all()
        return MemberMembership.objects.select_related(
            "member", "plan", "member__user"
        ).filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class MemberMembershipDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsStaff,)
    serializer_class = MemberMembershipSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return MemberMembership.objects.all()
        return MemberMembership.objects.filter(organization=user.organization)


class ActiveMembershipByMemberView(generics.ListAPIView):
    serializer_class = MemberMembershipSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return MemberMembership.objects.filter(
                member_id=self.kwargs["member_id"],
                is_active=True,
            )
        return MemberMembership.objects.filter(
            member_id=self.kwargs["member_id"],
            is_active=True,
            organization=user.organization,
        )
