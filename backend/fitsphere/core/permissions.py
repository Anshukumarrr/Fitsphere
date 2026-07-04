from rest_framework.permissions import BasePermission, SAFE_METHODS


TICKET_ELIGIBLE_ROLES = (
    "gym_owner", "super_admin", "trainer", "member",
    "manager", "instructor", "security", "cleaner", "maintenance",
)


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "super_admin"


class IsGymOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "gym_owner"


class IsGymOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ("gym_owner", "super_admin", "manager")


class IsReceptionist(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "receptionist"


class IsTrainer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "trainer"


class IsMember(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "member"


class IsStaff(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ("super_admin", "gym_owner", "receptionist", "trainer", "manager")


class IsStaffOrReadOnlyInstructor(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role in ("super_admin", "gym_owner", "receptionist", "trainer", "manager"):
            return True
        if request.user.role == "instructor" and request.method in SAFE_METHODS:
            return True
        return False


class HasRole(BasePermission):
    def __init__(self, *roles):
        self.roles = roles

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in self.roles


class IsTenantMember(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == "super_admin":
            return True
        if not hasattr(obj, "organization_id"):
            return True
        return obj.organization_id == request.user.organization_id
