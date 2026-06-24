from rest_framework import serializers

from .models import Invoice, Subscription, SubscriptionPlan


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = "__all__"


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    plan_tier = serializers.CharField(source="plan.tier", read_only=True)

    class Meta:
        model = Subscription
        fields = (
            "id",
            "organization",
            "plan",
            "plan_name",
            "plan_tier",
            "status",
            "billing_cycle",
            "trial_start",
            "trial_end",
            "current_period_start",
            "current_period_end",
            "cancelled_at",
            "auto_renew",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "organization",
            "trial_start",
            "trial_end",
            "current_period_start",
            "current_period_end",
            "created_at",
            "updated_at",
        )


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")
