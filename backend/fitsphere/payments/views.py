from rest_framework import generics

from ..core.permissions import IsGymOwnerOrAdmin, IsMember, IsStaff
from .models import Payment
from .serializers import PaymentCreateSerializer, PaymentSerializer


class PaymentListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsStaff | IsMember,)
    filterset_fields = (
        "member",
        "branch",
        "payment_type",
        "payment_method",
        "status",
    )
    search_fields = ("invoice_number", "member__user__first_name", "member__user__last_name")
    ordering_fields = ("paid_at", "amount")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PaymentCreateSerializer
        return PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Payment.objects.select_related("member", "member__user", "branch").all()
        if user.role == "member":
            return Payment.objects.select_related("member", "member__user", "branch").filter(
                member__user=user,
                organization=user.organization,
            )
        qs = Payment.objects.select_related("member", "member__user", "branch").filter(
            organization=user.organization
        )
        if user.role == "receptionist":
            qs = qs.filter(branch=user.receptionist_profile.branch)
        return qs


class PaymentDetailView(generics.RetrieveAPIView):
    permission_classes = (IsStaff | IsMember,)
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Payment.objects.select_related("member", "member__user").all()
        if user.role == "member":
            return Payment.objects.select_related("member", "member__user").filter(
                member__user=user,
                organization=user.organization,
            )
        return Payment.objects.select_related("member", "member__user").filter(
            organization=user.organization
        )
