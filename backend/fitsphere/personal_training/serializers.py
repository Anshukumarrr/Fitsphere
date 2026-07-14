from rest_framework import serializers

from ..members.models import Member
from .models import PTPackage, PTMembership, PTSession


class PTPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PTPackage
        fields = (
            "id",
            "organization",
            "name",
            "description",
            "number_of_sessions",
            "validity_days",
            "price",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "organization", "created_at", "updated_at")


class PTMembershipSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source="package.name", read_only=True)
    member_name = serializers.CharField(
        source="member.user.get_full_name", read_only=True
    )
    trainer_name = serializers.CharField(
        source="trainer.user.get_full_name", read_only=True
    )

    class Meta:
        model = PTMembership
        fields = (
            "id",
            "member",
            "member_name",
            "package",
            "package_name",
            "trainer",
            "trainer_name",
            "sessions_total",
            "sessions_used",
            "sessions_remaining",
            "start_date",
            "end_date",
            "amount_paid",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "sessions_remaining",
            "is_active",
            "created_at",
            "updated_at",
        )


class PTSessionSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source="member.user.get_full_name", read_only=True
    )
    trainer_name = serializers.CharField(
        source="trainer.user.get_full_name", read_only=True
    )

    class Meta:
        model = PTSession
        fields = (
            "id",
            "pt_membership",
            "member",
            "member_name",
            "trainer",
            "trainer_name",
            "branch",
            "scheduled_date",
            "scheduled_time",
            "duration_minutes",
            "status",
            "progress_notes",
            "rating",
            "completed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "completed_at", "created_at", "updated_at")


class PTSessionCreateSerializer(serializers.ModelSerializer):
    pt_membership = serializers.PrimaryKeyRelatedField(
        queryset=PTMembership.objects.all(), required=False, allow_null=True
    )
    member = serializers.PrimaryKeyRelatedField(
        queryset=Member.objects.all(), required=False
    )

    class Meta:
        model = PTSession
        fields = (
            "pt_membership",
            "member",
            "trainer",
            "branch",
            "scheduled_date",
            "scheduled_time",
            "duration_minutes",
        )

    def validate(self, data):
        pt_membership = data.get("pt_membership")
        if pt_membership:
            if pt_membership.sessions_remaining <= 0:
                raise serializers.ValidationError(
                    {"pt_membership": "This PT membership has no remaining sessions."}
                )
            member = data.get("member")
            if member and pt_membership.member_id != member.id:
                raise serializers.ValidationError(
                    {"pt_membership": "PT membership does not belong to this member."}
                )

        trainer = data["trainer"]
        date = data["scheduled_date"]
        time = data["scheduled_time"]
        duration = data.get("duration_minutes", 60)

        end_time = (
            time.hour * 60 + time.minute + duration
        )
        start_window = time.hour * 60 + time.minute
        end_window = end_time

        conflicts = PTSession.objects.filter(
            trainer=trainer,
            scheduled_date=date,
            status__in=("scheduled", "completed"),
        ).exclude(
            id=self.instance.pk if self.instance else None
        )

        for session in conflicts:
            session_start = (
                session.scheduled_time.hour * 60 + session.scheduled_time.minute
            )
            session_end = session_start + session.duration_minutes
            if start_window < session_end and end_window > session_start:
                raise serializers.ValidationError(
                    "Trainer is already booked for this time slot"
                )
        return data
