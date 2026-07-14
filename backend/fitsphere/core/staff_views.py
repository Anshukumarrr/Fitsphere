import logging
import secrets

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db.models import Count, Q
from django.template.loader import render_to_string
from rest_framework import generics, status
from rest_framework.response import Response

from .models import EmailVerificationToken
from .permissions import IsGymOwnerOrAdmin, IsGymOwnerOrManager, get_staff_branch
from .serializers import StaffCreateSerializer, StaffSerializer
from ..notifications.services import EmailService, WhatsAppService

logger = logging.getLogger(__name__)


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

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsGymOwnerOrManager()]
        return [IsGymOwnerOrAdmin()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StaffCreateSerializer
        return StaffSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = getattr(self.request.user, "organization", None)
        context["created_by"] = self.request.user
        return context

    def _build_base_filter(self):
        user = self.request.user
        if user.role == "super_admin":
            org_filter = {}
        else:
            org_filter = {"user__organization": user.organization}

        if user.role == "manager":
            branch = get_staff_branch(user)
            branch_filter = {"branch": branch} if branch else {}
        else:
            branch_filter = {}

        combined_filter = {**org_filter, **branch_filter}
        search = self.request.query_params.get("search", "").strip()
        q_base = Q(**combined_filter)
        if search:
            sq = Q(user__first_name__icontains=search) | Q(user__last_name__icontains=search) | Q(user__email__icontains=search)
            q_base &= sq
        return q_base

    def _build_role_records(self, records, role, qs):
        if role == "trainer":
            for t in qs:
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
        else:
            for r in qs:
                records.append(_build_staff_record(r, role))

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

        q_base = self._build_base_filter()
        role_filter = self.request.query_params.get("role")

        trainers_qs = Trainer.objects.select_related("user", "branch").filter(q_base).annotate(
            _active_member_count=Count("assigned_members", filter=Q(assigned_members__membership_status="active"))
        )
        receptionists_qs = ReceptionistProfile.objects.select_related("user", "branch").filter(q_base)
        cleaners_qs = CleanerProfile.objects.select_related("user", "branch").filter(q_base)
        managers_qs = ManagerProfile.objects.select_related("user", "branch").filter(q_base)
        security_qs = SecurityProfile.objects.select_related("user", "branch").filter(q_base)
        instructors_qs = InstructorProfile.objects.select_related("user", "branch").filter(q_base)
        maintenance_qs = MaintenanceProfile.objects.select_related("user", "branch").filter(q_base)

        role_qs_map = {
            "trainer": trainers_qs,
            "receptionist": receptionists_qs,
            "cleaner": cleaners_qs,
            "manager": managers_qs,
            "security": security_qs,
            "instructor": instructors_qs,
            "maintenance": maintenance_qs,
        }

        if role_filter:
            qs = role_qs_map.get(role_filter)
            return qs if qs is not None else Trainer.objects.none()

        records = []
        for role, qs in role_qs_map.items():
            self._build_role_records(records, role, qs)
        return records

    def list(self, request, *args, **kwargs):
        role_filter = request.query_params.get("role")
        if role_filter:
            qs = self.get_queryset()
            records = []
            self._build_role_records(records, role_filter, qs)
            page = self.paginate_queryset(records)
            if page is not None:
                serializer = StaffSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = StaffSerializer(records, many=True)
            return Response(serializer.data)

        records = self.get_queryset()
        page = self.paginate_queryset(records)
        if page is not None:
            serializer = StaffSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = StaffSerializer(records, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        profile = serializer.save()
        self._send_staff_verify_email(profile)
        self._send_welcome_notifications(profile)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        profile = serializer.instance
        user = profile.user
        record = _build_staff_record(profile, serializer.validated_data.get("role", user.role))
        out_serializer = StaffSerializer(record)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    def _send_staff_verify_email(self, profile):
        user = profile.user
        user.is_active = False
        user.save(update_fields=["is_active"])
        token = secrets.token_urlsafe(32)
        EmailVerificationToken.objects.update_or_create(user=user, defaults={"token": token})
        verify_url = self.request.build_absolute_uri(
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
            logger.exception("Failed to send staff verification email")

    # ponytail: direct send, bypasses template/pref system — add template-based
    # send_event_notification call when DB records are guaranteed
    def _send_welcome_notifications(self, profile):
        user = profile.user
        org = getattr(user, "organization", None)
        if user.phone:
            try:
                WhatsAppService().send(
                    recipient_phone=user.phone,
                    message=f"Welcome to FitSphere, {user.first_name or user.username}! We are excited to have you with us.",
                    event="welcome",
                    organization=org,
                )
            except Exception:
                logger.exception("Failed to send WhatsApp welcome to staff %s", user.id)
        if user.email:
            try:
                EmailService().send(
                    recipient=user.email,
                    subject="Welcome to FitSphere!",
                    body=f"Hi {user.first_name or user.username},\n\nWelcome to FitSphere! We are excited to have you on board.\n\nBest,\nFitSphere Team",
                )
            except Exception:
                logger.exception("Failed to send email welcome to staff %s", user.id)


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
                branch = get_staff_branch(user)
                if branch:
                    org_filter["branch"] = branch

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
