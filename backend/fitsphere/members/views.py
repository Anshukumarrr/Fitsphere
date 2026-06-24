from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from ..core.permissions import IsGymOwnerOrAdmin, IsReceptionist, IsStaff
from .models import Member
from .serializers import MemberCreateSerializer, MemberSerializer, MemberStatusUpdateSerializer


class MemberListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsStaff,)
    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__email",
        "user__username",
        "user__phone",
    )
    filterset_fields = ("branch", "membership_status", "gender")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MemberCreateSerializer
        return MemberSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = getattr(self.request.user, "organization", None)
        return context

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Member.objects.select_related("user", "branch").all()
        org = user.organization
        if user.role == "receptionist":
            return Member.objects.select_related("user", "branch").filter(
                organization=org, branch=user.receptionist_profile.branch
            )
        return Member.objects.select_related("user", "branch").filter(
            organization=org
        )


class MemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsStaff,)
    serializer_class = MemberSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Member.objects.select_related("user", "branch").all()
        org = user.organization
        return Member.objects.select_related("user", "branch").filter(
            organization=org
        )

    def perform_destroy(self, instance):
        instance.user.is_active = False
        instance.user.save()
        instance.is_active = False
        instance.save()


class MemberStatusChangeView(generics.UpdateAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    serializer_class = MemberStatusUpdateSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Member.objects.all()
        return Member.objects.filter(organization=user.organization)

    def update(self, request, *args, **kwargs):
        member = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member.membership_status = serializer.validated_data["membership_status"]
        if "membership_end_date" in serializer.validated_data:
            member.membership_end_date = serializer.validated_data["membership_end_date"]
        member.save()
        return Response(MemberSerializer(member).data)
