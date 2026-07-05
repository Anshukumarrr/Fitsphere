import logging

import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.db.models import Count, Q
from django.shortcuts import redirect
from django.template.loader import render_to_string
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import EmailVerificationToken

from .serializers import (
    LoginSerializer,
    ReceptionistCreateSerializer,
    RegisterSerializer,
    StaffCreateSerializer,
    StaffSerializer,
    UserSerializer,
)
from .permissions import IsGymOwnerOrAdmin, IsSuperAdmin

User = get_user_model()
logger = logging.getLogger(__name__)


class RegisterThrottle(AnonRateThrottle):
    rate = "10/hour"


class LoginThrottle(AnonRateThrottle):
    rate = "10/min"


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    throttle_classes = [RegisterThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = secrets.token_urlsafe(32)
        EmailVerificationToken.objects.update_or_create(
            user=user, defaults={"token": token}
        )

        verify_url = request.build_absolute_uri(
            f"/api/v1/auth/verify-email/?token={token}&uid={user.id}"
        )

        try:
            html_body = render_to_string("emails/verify_email.html", {
                "name": user.first_name or user.username,
                "verify_url": verify_url,
            })
            text_body = render_to_string("emails/verify_email.txt", {
                "name": user.first_name or user.username,
                "verify_url": verify_url,
            })
            msg = EmailMultiAlternatives(
                subject="Verify your FitSphere email address",
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
        except Exception:
            logger.exception("Failed to send verification email")

        return Response(
            {
                "detail": "Account created. Check your email to verify your account.",
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, *args, **kwargs):
        token = request.query_params.get("token")
        uid = request.query_params.get("uid")

        if not token or not uid:
            return redirect(f"{settings.FRONTEND_URL}/login?verified=invalid")

        try:
            uid = int(uid)
        except (ValueError, TypeError):
            return redirect(f"{settings.FRONTEND_URL}/login?verified=invalid")

        try:
            user = User.objects.get(pk=uid, is_active=False)
        except User.DoesNotExist:
            return redirect(f"{settings.FRONTEND_URL}/login?verified=invalid")

        try:
            verification = EmailVerificationToken.objects.get(user=user, token=token)
        except EmailVerificationToken.DoesNotExist:
            return redirect(f"{settings.FRONTEND_URL}/login?verified=invalid")

        if verification.is_expired():
            verification.delete()
            return redirect(f"{settings.FRONTEND_URL}/login?verified=expired")

        user.is_active = True
        user.save(update_fields=["is_active"])
        verification.delete()

        refresh = RefreshToken.for_user(user)
        return redirect(
            f"{settings.FRONTEND_URL}/dashboard?access={refresh.access_token}&refresh={refresh}"
        )


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    throttle_classes = [LoginThrottle]


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    queryset = User.objects.select_related("member_profile", "organization").all()
    serializer_class = UserSerializer
    permission_classes = (IsSuperAdmin,)
    filterset_fields = ("role", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsSuperAdmin,)


class ReceptionistListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReceptionistCreateSerializer
        from .serializers import UserSerializer
        return UserSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = getattr(self.request.user, "organization", None)
        context["created_by"] = self.request.user
        return context

    def get_queryset(self):
        from .models import ReceptionistProfile
        user = self.request.user
        if user.role == "super_admin":
            return ReceptionistProfile.objects.select_related("user", "branch").all()
        return ReceptionistProfile.objects.select_related("user", "branch").filter(
            user__organization=user.organization
        )

    def perform_create(self, serializer):
        profile = serializer.save()
        self._send_credentials_email(profile)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        from .serializers import UserSerializer
        return Response(
            UserSerializer(serializer.instance.user).data,
            status=status.HTTP_201_CREATED,
        )

    def _send_credentials_email(self, profile):
        user = profile.user
        try:
            html_body = render_to_string("emails/staff_credentials.html", {
                "name": user.first_name or user.username,
                "username": user.username,
                "password": self.request.data.get("password", ""),
                "role": "Receptionist",
                "frontend_url": settings.FRONTEND_URL,
            })
            msg = EmailMultiAlternatives(
                subject="Your FitSphere Receptionist Account",
                body=f"Username: {user.username}\nPassword: {self.request.data.get('password', '')}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
        except Exception:
            logger.exception("Failed to send credentials email")


def _build_staff_record(profile, role_name, extra_fields=None):
    branch = profile.branch if hasattr(profile, "branch") else getattr(profile, "branch", None)
    user = profile.user
    record = {
        "id": profile.id,
        "user": user,
        "full_name": user.get_full_name(),
        "role": role_name,
        "branch": branch.id if branch else None,
        "branch_name": branch.name if branch else None,
        "branch_details": branch,
        "is_active": user.is_active,
        "profile_id": profile.id,
        "created_at": profile.created_at if hasattr(profile, "created_at") else None,
        "specialization": None,
        "years_of_experience": None,
        "hourly_rate": None,
        "max_members": None,
        "session_rating": None,
        "total_sessions": None,
        "active_member_count": None,
        "bio": None,
        "qualifications": None,
    }
    if extra_fields:
        record.update(extra_fields)
    return record


class StaffListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StaffCreateSerializer
        return StaffSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = getattr(self.request.user, "organization", None)
        context["created_by"] = self.request.user
        return context

    def get_queryset(self):
        from ..trainers.models import Trainer
        from .models import (
            CleanerProfile,
            InstructorProfile,
            MaintenanceProfile,
            ManagerProfile,
            ReceptionistProfile,
            SecurityProfile,
        )

        user = self.request.user
        if user.role == "super_admin":
            org_filter = {}
        else:
            org_filter = {"user__organization": user.organization}

        if user.role == "manager":
            try:
                branch = user.manager_profile.branch
                if branch:
                    branch_filter = {"branch": branch}
                else:
                    branch_filter = {}
            except Exception:
                branch_filter = {}
        else:
            branch_filter = {}

        combined_filter = {**org_filter, **branch_filter}
        trainers = Trainer.objects.select_related("user", "branch").filter(**combined_filter).annotate(
            _active_member_count=Count("assigned_members", filter=Q(assigned_members__membership_status="active"))
        )
        receptionists = ReceptionistProfile.objects.select_related("user", "branch").filter(**combined_filter)
        cleaners = CleanerProfile.objects.select_related("user", "branch").filter(**combined_filter)
        managers = ManagerProfile.objects.select_related("user", "branch").filter(**combined_filter)
        security = SecurityProfile.objects.select_related("user", "branch").filter(**combined_filter)
        instructors = InstructorProfile.objects.select_related("user", "branch").filter(**combined_filter)
        maintenance = MaintenanceProfile.objects.select_related("user", "branch").filter(**combined_filter)

        records = []

        for t in trainers:
            records.append(_build_staff_record(t, "trainer", {
                "specialization": t.specialization,
                "years_of_experience": t.years_of_experience,
                "hourly_rate": t.hourly_rate,
                "max_members": t.max_members,
                "session_rating": t.session_rating,
                "total_sessions": t.total_sessions,
                "active_member_count": t._active_member_count,
                "bio": t.bio,
                "qualifications": t.qualifications,
            }))

        for r in receptionists:
            records.append(_build_staff_record(r, "receptionist"))

        for c in cleaners:
            records.append(_build_staff_record(c, "cleaner"))

        for m in managers:
            records.append(_build_staff_record(m, "manager"))

        for s in security:
            records.append(_build_staff_record(s, "security"))

        for i in instructors:
            records.append(_build_staff_record(i, "instructor"))

        for m in maintenance:
            records.append(_build_staff_record(m, "maintenance"))

        return records

    def list(self, request, *args, **kwargs):
        records = self.get_queryset()
        page = self.paginate_queryset(records)
        if page is not None:
            serializer = StaffSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = StaffSerializer(records, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        profile = serializer.save()
        self._send_staff_credentials_email(profile)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        profile = serializer.instance
        user = profile.user
        record = _build_staff_record(profile, serializer.validated_data.get("role", user.role))
        out_serializer = StaffSerializer(record)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    def _send_staff_credentials_email(self, profile):
        user = profile.user
        role_display = user.get_role_display()
        try:
            html_body = render_to_string("emails/staff_credentials.html", {
                "name": user.first_name or user.username,
                "username": user.username,
                "password": self.request.data.get("password", ""),
                "role": role_display,
                "frontend_url": settings.FRONTEND_URL,
            })
            msg = EmailMultiAlternatives(
                subject=f"Your FitSphere {role_display} Account",
                body=f"Username: {user.username}\nPassword: {self.request.data.get('password', '')}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
        except Exception:
            logger.exception("Failed to send staff credentials email")


class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    serializer_class = StaffSerializer

    def get_object(self):
        from ..trainers.models import Trainer
        from .models import (
            CleanerProfile,
            InstructorProfile,
            MaintenanceProfile,
            ManagerProfile,
            ReceptionistProfile,
            SecurityProfile,
        )

        pk = self.kwargs["pk"]
        role = self.request.query_params.get("role")

        user = self.request.user
        org_filter = {}
        if user.role != "super_admin":
            org_filter = {"user__organization": user.organization}
            if user.role == "manager":
                try:
                    branch = user.manager_profile.branch
                    if branch:
                        org_filter["branch"] = branch
                except Exception:
                    pass

        profile = None
        actual_role = role

        if role == "trainer" or not role:
            profile = Trainer.objects.select_related("user", "branch").filter(pk=pk, **org_filter).first()
            if profile:
                actual_role = "trainer"
        if not profile and (role == "receptionist" or not role):
            profile = ReceptionistProfile.objects.select_related("user", "branch").filter(pk=pk, **org_filter).first()
            if profile:
                actual_role = "receptionist"
        if not profile and (role == "cleaner" or not role):
            profile = CleanerProfile.objects.select_related("user", "branch").filter(pk=pk, **org_filter).first()
            if profile:
                actual_role = "cleaner"
        if not profile and (role == "manager" or not role):
            profile = ManagerProfile.objects.select_related("user", "branch").filter(pk=pk, **org_filter).first()
            if profile:
                actual_role = "manager"
        if not profile and (role == "security" or not role):
            profile = SecurityProfile.objects.select_related("user", "branch").filter(pk=pk, **org_filter).first()
            if profile:
                actual_role = "security"
        if not profile and (role == "instructor" or not role):
            profile = InstructorProfile.objects.select_related("user", "branch").filter(pk=pk, **org_filter).first()
            if profile:
                actual_role = "instructor"
        if not profile and (role == "maintenance" or not role):
            profile = MaintenanceProfile.objects.select_related("user", "branch").filter(pk=pk, **org_filter).first()
            if profile:
                actual_role = "maintenance"

        if not profile:
            from rest_framework.exceptions import NotFound
            raise NotFound("Staff member not found.")

        extra = {}
        if actual_role == "trainer":
            extra = {
                "specialization": profile.specialization,
                "years_of_experience": profile.years_of_experience,
                "hourly_rate": profile.hourly_rate,
                "max_members": profile.max_members,
                "session_rating": profile.session_rating,
                "total_sessions": profile.total_sessions,
                "active_member_count": getattr(profile, "_active_member_count", profile.assigned_members.filter(membership_status="active").count()),
                "bio": profile.bio,
                "qualifications": profile.qualifications,
            }

        self._staff_record = _build_staff_record(profile, actual_role, extra)
        return self._staff_record

    def perform_destroy(self, instance):
        user = instance["user"]
        user.is_active = False
        user.save()
