from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.db.models import Count, Q
from rest_framework import generics
from rest_framework.response import Response

from ..core.permissions import IsGymOwnerOrAdmin, IsMember, IsStaff
from .models import Trainer
from .serializers import TrainerCreateSerializer, TrainerSerializer


class TrainerListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__email",
        "specialization",
    )
    filterset_fields = ("branch", "is_active", "specialization")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TrainerCreateSerializer
        return TrainerSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = getattr(self.request.user, "organization", None)
        context["created_by"] = self.request.user
        return context

    def get_queryset(self):
        user = self.request.user
        qs = Trainer.objects.select_related("user").annotate(
            active_member_count=Count("assigned_members", filter=Q(assigned_members__membership_status="active"))
        )
        if user.role == "super_admin":
            return qs.all()
        return qs.filter(organization=user.organization)

    def perform_create(self, serializer):
        trainer = serializer.save()
        self._send_credentials_email(trainer)

    def _send_credentials_email(self, trainer):
        user = trainer.user
        try:
            html_body = render_to_string("emails/staff_credentials.html", {
                "name": user.first_name or user.username,
                "username": user.username,
                "password": self.request.data.get("password", ""),
                "role": "Trainer",
                "frontend_url": settings.FRONTEND_URL,
            })
            msg = EmailMultiAlternatives(
                subject="Your FitSphere Trainer Account",
                body=f"Username: {user.username}\nPassword: {self.request.data.get('password', '')}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
        except Exception:
            pass


class TrainerDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    serializer_class = TrainerSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Trainer.objects.select_related("user").annotate(
            active_member_count=Count("assigned_members", filter=Q(assigned_members__membership_status="active"))
        )
        if user.role == "super_admin":
            return qs.all()
        return qs.filter(organization=user.organization)


class TrainerByBranchView(generics.ListAPIView):
    serializer_class = TrainerSerializer
    permission_classes = (IsStaff | IsMember,)

    def get_queryset(self):
        user = self.request.user
        qs = Trainer.objects.select_related("user").annotate(
            active_member_count=Count("assigned_members", filter=Q(assigned_members__membership_status="active"))
        ).filter(
            branch_id=self.kwargs["branch_id"]
        )
        if user.role != "super_admin":
            qs = qs.filter(organization=user.organization)
        return qs
