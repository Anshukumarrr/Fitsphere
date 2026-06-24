from rest_framework import generics

from ..core.permissions import IsSuperAdmin
from .models import Invoice, Subscription, SubscriptionPlan
from .serializers import (
    InvoiceSerializer,
    SubscriptionPlanSerializer,
    SubscriptionSerializer,
)


class SubscriptionPlanListCreateView(generics.ListCreateAPIView):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = (IsSuperAdmin,)


class SubscriptionPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = (IsSuperAdmin,)


class SubscriptionListView(generics.ListAPIView):
    queryset = Subscription.objects.select_related("organization", "plan").all()
    serializer_class = SubscriptionSerializer
    permission_classes = (IsSuperAdmin,)
    filterset_fields = ("status", "plan")


class SubscriptionDetailView(generics.RetrieveUpdateAPIView):
    queryset = Subscription.objects.select_related("organization", "plan").all()
    serializer_class = SubscriptionSerializer
    permission_classes = (IsSuperAdmin,)


class InvoiceListView(generics.ListAPIView):
    queryset = Invoice.objects.select_related("organization").all()
    serializer_class = InvoiceSerializer
    permission_classes = (IsSuperAdmin,)
    filterset_fields = ("status", "organization")
    ordering = ("-created_at",)
