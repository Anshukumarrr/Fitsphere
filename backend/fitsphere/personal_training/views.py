from rest_framework import generics, permissions, serializers
from rest_framework.response import Response

from ..core.permissions import IsGymOwnerOrAdmin, IsMember, IsStaff, get_staff_branch
from ..members.models import Member
from ..trainers.models import Trainer
from .models import PTPackage, PTMembership, PTSession
from .serializers import (
    PTPackageSerializer,
    PTMembershipSerializer,
    PTSessionCreateSerializer,
    PTSessionSerializer,
)


class PTPackageListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    serializer_class = PTPackageSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return PTPackage.objects.all()
        return PTPackage.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class PTPackageDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    serializer_class = PTPackageSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return PTPackage.objects.all()
        return PTPackage.objects.filter(organization=user.organization)


class PTMembershipListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsStaff,)
    serializer_class = PTMembershipSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return PTMembership.objects.select_related(
                "member", "member__user", "package", "trainer", "trainer__user"
            ).all()
        qs = PTMembership.objects.select_related(
            "member", "member__user", "package", "trainer", "trainer__user"
        ).filter(organization=user.organization)
        if user.role == "manager":
            branch = get_staff_branch(user)
            if branch:
                qs = qs.filter(member__branch=branch)
        return qs

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class PTMembershipDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsStaff,)
    serializer_class = PTMembershipSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return PTMembership.objects.all()
        qs = PTMembership.objects.filter(organization=user.organization)
        if user.role == "manager":
            branch = get_staff_branch(user)
            if branch:
                qs = qs.filter(member__branch=branch)
        return qs


class PTSessionListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsStaff | IsMember,)
    filterset_fields = ("trainer", "member", "status", "scheduled_date")
    ordering_fields = ("scheduled_date", "scheduled_time")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PTSessionCreateSerializer
        return PTSessionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return PTSession.objects.select_related(
                "member", "member__user", "trainer", "trainer__user"
            ).all()
        if user.role == "member":
            try:
                member = user.member_profile
            except Member.DoesNotExist:
                return PTSession.objects.none()
            return PTSession.objects.select_related(
                "member", "member__user", "trainer", "trainer__user"
            ).filter(
                member=member,
                organization=user.organization,
            )
        qs = PTSession.objects.select_related(
            "member", "member__user", "trainer", "trainer__user"
        ).filter(organization=user.organization)
        if user.role == "trainer":
            try:
                trainer = user.trainer_profile
            except Trainer.DoesNotExist:
                return PTSession.objects.none()
            qs = qs.filter(trainer=trainer)
        if user.role == "manager":
            branch = get_staff_branch(user)
            if branch:
                qs = qs.filter(trainer__branch=branch)
        return qs

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class PTSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsStaff,)
    serializer_class = PTSessionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return PTSession.objects.all()
        qs = PTSession.objects.filter(organization=user.organization)
        if user.role == "manager":
            branch = get_staff_branch(user)
            if branch:
                qs = qs.filter(trainer__branch=branch)
        return qs


class BookSessionView(generics.CreateAPIView):
    permission_classes = (IsMember,)
    serializer_class = PTSessionCreateSerializer

    def perform_create(self, serializer):
        try:
            member = self.request.user.member_profile
        except Member.DoesNotExist:
            raise serializers.ValidationError(
                {"error": "Member profile not found."}
            )

        pt_membership = serializer.validated_data.get("pt_membership")
        if not pt_membership:
            pt_membership = PTMembership.objects.filter(
                member=member,
                is_active=True,
                sessions_remaining__gt=0,
            ).first()
            if not pt_membership:
                raise serializers.ValidationError(
                    {"pt_membership": "No active PT membership with remaining sessions."}
                )

        serializer.save(
            member=member,
            pt_membership=pt_membership,
            organization=self.request.user.organization,
            branch=member.branch,
        )
