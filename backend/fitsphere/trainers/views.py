from rest_framework import generics

from ..core.permissions import IsGymOwnerOrAdmin, IsStaff
from .models import Trainer
from .serializers import TrainerSerializer


class TrainerListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    serializer_class = TrainerSerializer
    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__email",
        "specialization",
    )
    filterset_fields = ("branch", "is_active", "specialization")

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Trainer.objects.select_related("user").all()
        return Trainer.objects.select_related("user").filter(
            organization=user.organization
        )

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class TrainerDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)
    serializer_class = TrainerSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Trainer.objects.select_related("user").all()
        return Trainer.objects.select_related("user").filter(
            organization=user.organization
        )


class TrainerByBranchView(generics.ListAPIView):
    serializer_class = TrainerSerializer
    permission_classes = (IsStaff,)

    def get_queryset(self):
        return Trainer.objects.filter(
            branch_id=self.kwargs["branch_id"]
        )
