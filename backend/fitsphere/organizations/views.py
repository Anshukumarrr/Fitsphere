from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from ..core.permissions import IsGymOwnerOrAdmin, IsSuperAdmin
from .cloudinary_utils import upload_image
from .models import Branch, GymOrganization, InviteCode, StaffInvite
from .serializers import (
    BranchSerializer,
    GymOrganizationSerializer,
    GymProfileSerializer,
    PublicGymSerializer,
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


class InviteCodeView(generics.GenericAPIView):
    """Return the current daily signup code(s) for the caller's organization.

    - ``kind=staff``  → gym owner only; one code per active branch.
    - ``kind=member`` → trainer/receptionist/manager; the caller's branch code.
    Codes rotate daily at 00:01 IST; this view lazy-generates today's code
    when the scheduler hasn't run yet.
    """

    permission_classes = (permissions.IsAuthenticated,)

    # Roles allowed to see each code kind
    STAFF_KIND_ROLES = ("gym_owner",)
    MEMBER_KIND_ROLES = ("gym_owner", "trainer", "receptionist", "manager")

    def get(self, request):
        kind = request.query_params.get("kind", "member")
        if kind not in ("staff", "member"):
            return Response(
                {"detail": "Invalid kind. Use 'staff' or 'member'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        org = user.organization
        if org is None:
            return Response(
                {"detail": "Your account is not linked to a gym."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from datetime import datetime, timedelta
        from zoneinfo import ZoneInfo

        rotates_at = (
            datetime.now(ZoneInfo("Asia/Kolkata")) + timedelta(days=1)
        ).replace(hour=0, minute=1, second=0, microsecond=0).isoformat()

        if kind == "staff":
            if user.role not in self.STAFF_KIND_ROLES:
                return Response(
                    {"detail": "Only gym owners can view the staff invite code."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            codes = []
            for branch in org.branches.filter(is_active=True).order_by("name"):
                invite = InviteCode.get_current(org, branch, InviteCode.Kind.STAFF)
                codes.append(
                    {"branch": branch.id, "branch_name": branch.name, "code": invite.code}
                )
            return Response(
                {"kind": "staff", "codes": codes, "rotates_at": rotates_at}
            )

        # kind == "member"
        if user.role not in self.MEMBER_KIND_ROLES:
            return Response(
                {"detail": "You are not allowed to view the member invite code."},
                status=status.HTTP_403_FORBIDDEN,
            )
        branch = self._get_caller_branch(user)
        # Gym owners aren't bound to one branch — show the org's first branch.
        if branch is None and user.role == "gym_owner":
            branch = org.branches.filter(is_active=True).order_by("id").first()
        if branch is None:
            return Response(
                {"detail": "No branch is assigned to your account. Ask your gym owner."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invite = InviteCode.get_current(org, branch, InviteCode.Kind.MEMBER)
        return Response(
            {
                "kind": "member",
                "branch": branch.id,
                "branch_name": branch.name,
                "code": invite.code,
                "rotates_at": rotates_at,
            }
        )

    @staticmethod
    def _get_caller_branch(user):
        """Resolve the caller's branch from their role profile."""
        accessors = {
            "trainer": "trainer_profile",
            "receptionist": "receptionist_profile",
            "manager": "manager_profile",
        }
        accessor = accessors.get(user.role)
        if not accessor:
            return None
        profile = getattr(user, accessor, None)
        return getattr(profile, "branch", None) if profile else None


class PublicGymListView(generics.ListAPIView):
    """Public storefront listing for the landing page (no auth required).

    Returns only active gyms; unpaginated plain array so the landing page can
    render it directly.
    """

    serializer_class = PublicGymSerializer
    permission_classes = (permissions.AllowAny,)
    pagination_class = None

    def get_queryset(self):
        return GymOrganization.objects.filter(is_active=True).order_by("name")


class GymProfileView(generics.RetrieveUpdateAPIView):
    """Gym public-profile read/edit.

    GET: any authenticated member of the org may read.
    PATCH: gated to gym_owner + receptionist. Accepts multipart form data with
    optional `banner_image` / `profile_image` file fields alongside the text
    fields (name, owner_name, description, contact/address).
    """

    serializer_class = GymProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ("get", "patch", "head", "options")

    def get_object(self):
        org = self.request.user.organization
        if org is None:
            raise NotFound("No organization is associated with this account.")
        return org

    def update(self, request, *args, **kwargs):
        role = getattr(request.user, "role", "")
        if role not in ("gym_owner", "receptionist"):
            return Response(
                {"detail": "Only the gym owner or receptionist can edit the gym profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        org = self.get_object()

        banner = request.FILES.get("banner_image")
        picture = request.FILES.get("profile_image")
        if banner:
            org.banner_public_id = upload_image(banner, folder="gym_banners")
        if picture:
            org.picture_public_id = upload_image(picture, folder="gym_avatars")

        serializer = self.get_serializer(org, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(self.get_serializer(org).data)
