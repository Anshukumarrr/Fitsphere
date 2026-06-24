from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source="member.user.get_full_name", read_only=True
    )
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Payment
        fields = (
            "id",
            "member",
            "member_name",
            "branch",
            "branch_name",
            "payment_type",
            "payment_method",
            "status",
            "amount",
            "invoice_number",
            "description",
            "reference_id",
            "received_by",
            "paid_at",
            "created_at",
            "updated_at",
            "organization",
        )
        read_only_fields = (
            "id",
            "invoice_number",
            "received_by",
            "paid_at",
            "created_at",
            "updated_at",
            "organization",
        )


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "member",
            "branch",
            "payment_type",
            "payment_method",
            "status",
            "amount",
            "description",
            "reference_id",
        )

    def create(self, validated_data):
        validated_data["received_by"] = self.context["request"].user
        validated_data["organization"] = self.context["request"].user.organization
        return super().create(validated_data)
