from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from ..core.permissions import IsGymOwnerOrAdmin, IsReceptionist, IsStaff
from .models import AttendanceCode, AttendanceLog, QRCode
from .serializers import (
    AttendanceCodeSerializer,
    AttendanceLogSerializer,
    CodeCheckInSerializer,
    QRCheckInSerializer,
    QRCodeSerializer,
)


class QRCodeListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    serializer_class = QRCodeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return QRCode.objects.all()
        return QRCode.objects.filter(branch__organization=user.organization)


class AttendanceLogListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = AttendanceLogSerializer
    filterset_fields = ("branch", "member", "check_in_method", "session_type")
    ordering_fields = ("check_in_time",)

    def get_queryset(self):
        user = self.request.user
        qs = AttendanceLog.objects.select_related(
            "member", "member__user", "branch"
        ).all()
        if user.role == "super_admin":
            return qs
        if user.role in ("member",):
            return qs.filter(member__user=user)
        if user.role in ("security", "cleaner", "maintenance"):
            return AttendanceLog.objects.none()
        if user.role in ("receptionist", "trainer", "manager", "instructor"):
            branch = self._get_branch_for_user(user)
            return qs.filter(
                organization=user.organization,
                branch=branch,
            )
        return qs.filter(organization=user.organization)

    def _get_branch_for_user(self, user):
        profile_map = {
            "receptionist": "receptionist_profile",
            "trainer": "trainer_profile",
            "manager": "manager_profile",
            "instructor": "instructor_profile",
        }
        attr = profile_map.get(user.role)
        if attr:
            try:
                return getattr(user, attr).branch
            except Exception:
                return None
        return None


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def qr_check_in(request):
    serializer = QRCheckInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    from ..members.models import Member

    member = Member.objects.filter(
        id=serializer.validated_data["member_id"]
    ).first()
    if not member:
        return Response(
            {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
        )

    recent = AttendanceLog.objects.filter(
        member=member,
        check_in_time__gte=timezone.now() - timedelta(minutes=30),
    ).exists()
    if recent:
        return Response(
            {"error": "Duplicate check-in within 30 minutes"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    log = AttendanceLog.objects.create(
        member=member,
        branch=serializer.validated_data["branch"],
        organization=member.organization,
        check_in_method="qr",
        marked_by=request.user,
    )
    return Response(
        AttendanceLogSerializer(log).data, status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsReceptionist])
def manual_check_in(request):
    member_id = request.data.get("member_id")
    from ..members.models import Member

    member = Member.objects.filter(id=member_id).first()
    if not member:
        return Response(
            {"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND
        )

    from ..core.models import ReceptionistProfile
    try:
        branch = request.user.receptionist_profile.branch
    except ReceptionistProfile.DoesNotExist:
        return Response(
            {"error": "Receptionist profile not found"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    log = AttendanceLog.objects.create(
        member=member,
        branch=branch,
        organization=member.organization,
        check_in_method="manual",
        marked_by=request.user,
    )
    return Response(
        AttendanceLogSerializer(log).data, status=status.HTTP_201_CREATED
    )


def _get_org_id(request):
    if request.user.role == "super_admin":
        org_id = (
            request.data.get("organization") if hasattr(request, "data") else None
        ) or request.query_params.get("organization")
        if org_id:
            return int(org_id)
        from ..organizations.models import GymOrganization
        first_org = GymOrganization.objects.order_by("id").first()
        return first_org.id if first_org else None
    return request.user.organization_id


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def generate_code(request):
    if request.user.role not in ("gym_owner", "receptionist", "super_admin", "manager"):
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
    org_id = _get_org_id(request)
    if not org_id:
        return Response({"error": "Organization required"}, status=status.HTTP_400_BAD_REQUEST)
    branch_id = request.data.get("branch")
    branch = None
    if request.user.role == "receptionist":
        from ..core.models import ReceptionistProfile
        try:
            branch = request.user.receptionist_profile.branch
        except ReceptionistProfile.DoesNotExist:
            pass
    elif branch_id:
        from ..organizations.models import Branch
        try:
            branch = Branch.objects.get(id=branch_id, organization_id=org_id)
        except Branch.DoesNotExist:
            pass
    from ..organizations.models import GymOrganization
    org = GymOrganization.objects.get(id=org_id)
    code_obj = AttendanceCode.generate(
        organization=org,
        branch=branch,
        user=request.user,
    )
    return Response(AttendanceCodeSerializer(code_obj).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def active_code(request):
    org_id = _get_org_id(request)
    if not org_id:
        return Response({"code": None, "message": "No active code"}, status=status.HTTP_200_OK)
    branch_id = request.query_params.get("branch")
    qs = AttendanceCode.objects.filter(
        organization_id=org_id,
        is_active=True,
        expires_at__gt=timezone.now(),
    )
    if branch_id:
        qs = qs.filter(branch_id=branch_id)
    code_obj = qs.order_by("-generated_at").first()
    if not code_obj:
        return Response({"code": None, "message": "No active code"}, status=status.HTTP_200_OK)
    return Response(AttendanceCodeSerializer(code_obj).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def code_check_in(request):
    serializer = CodeCheckInSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    code_obj = serializer.validated_data["code"]

    from ..members.models import Member
    try:
        member = request.user.member_profile
    except Member.DoesNotExist:
        return Response({"error": "No member profile found"}, status=status.HTTP_400_BAD_REQUEST)

    if member.organization != code_obj.organization:
        return Response({"error": "Code does not belong to your organization"}, status=status.HTTP_400_BAD_REQUEST)

    recent = AttendanceLog.objects.filter(
        member=member,
        check_in_time__gte=timezone.now() - timedelta(minutes=30),
    ).exists()
    if recent:
        return Response(
            {"error": "Duplicate check-in within 30 minutes"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    log = AttendanceLog.objects.create(
        member=member,
        branch=member.branch,
        organization=member.organization,
        check_in_method="code",
        marked_by=request.user,
    )
    return Response(
        AttendanceLogSerializer(log).data, status=status.HTTP_201_CREATED
    )
