from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from ..core.permissions import IsGymOwnerOrAdmin, IsGymOwnerOrManager, IsReceptionist, IsStaffOrReadOnlyInstructor, STAFF_BRANCH_SCOPED_ROLES, get_staff_branch
from .models import Member
from .import_serializers import MemberImportFileSerializer
from .serializers import MemberCreateSerializer, MemberSerializer, MemberStatusUpdateSerializer


class MemberListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsStaffOrReadOnlyInstructor,)
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
        context["created_by"] = self.request.user
        return context

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Member.objects.select_related("user", "branch").all()
        org = user.organization
        if user.role in STAFF_BRANCH_SCOPED_ROLES:
            branch = get_staff_branch(user)
            return Member.objects.select_related("user", "branch").filter(
                organization=org, branch=branch
            )
        return Member.objects.select_related("user", "branch").filter(
            organization=org
        )

    def perform_create(self, serializer):
        member = serializer.save()
        self._send_credentials_email(member)

    def _send_credentials_email(self, member):
        user = member.user
        try:
            html_body = render_to_string("emails/member_credentials.html", {
                "name": user.first_name or user.username,
                "username": user.username,
                "password": self.request.data.get("password", ""),
                "frontend_url": settings.FRONTEND_URL,
            })
            msg = EmailMultiAlternatives(
                subject="Your FitSphere Member Account",
                body=f"Username: {user.username}\nPassword: {self.request.data.get('password', '')}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
        except Exception:
            import logging
            logging.getLogger(__name__).exception("Failed to send member credentials email")


class MemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsStaffOrReadOnlyInstructor,)
    serializer_class = MemberSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Member.objects.select_related("user", "branch").all()
        org = user.organization
        if user.role in STAFF_BRANCH_SCOPED_ROLES:
            branch = get_staff_branch(user)
            return Member.objects.select_related("user", "branch").filter(
                organization=org, branch=branch
            )
        return Member.objects.select_related("user", "branch").filter(
            organization=org
        )

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "true":
            instance.user.delete()
        else:
            instance.user.is_active = False
            instance.user.save()
            instance.membership_status = "cancelled"
            instance.save()


class MemberStatusChangeView(generics.UpdateAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    serializer_class = MemberStatusUpdateSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Member.objects.all()
        org = user.organization
        if user.role == "manager":
            branch = get_staff_branch(user)
            return Member.objects.filter(organization=org, branch=branch)
        return Member.objects.filter(organization=org)

    def update(self, request, *args, **kwargs):
        member = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member.membership_status = serializer.validated_data["membership_status"]
        if "membership_end_date" in serializer.validated_data:
            member.membership_end_date = serializer.validated_data["membership_end_date"]
        member.save()
        return Response(MemberSerializer(member).data)


class BulkMemberImportView(generics.CreateAPIView):
    permission_classes = (IsGymOwnerOrManager,)
    serializer_class = MemberImportFileSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]

        org = request.user.organization
        branch = get_staff_branch(request.user) if request.user.role in STAFF_BRANCH_SCOPED_ROLES else None

        from .import_service import import_members_from_file

        result = import_members_from_file(
            file_obj=file,
            organization=org,
            created_by=request.user,
            branch=branch,
        )

        return Response({
            "total": result.total,
            "created": result.created,
            "skipped": result.skipped,
            "errors": [
                {"row": e.row, "field": e.field, "value": e.value, "message": e.message}
                for e in result.errors
            ],
        }, status=status.HTTP_200_OK)
