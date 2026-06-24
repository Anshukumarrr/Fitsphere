from datetime import date, timedelta

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from ..core.permissions import IsGymOwnerOrAdmin
from ..members.models import Member
from ..payments.models import Payment
from ..attendance.models import AttendanceLog
from ..memberships.models import MemberMembership


def _org_filter(request):
    if request.user.role == "super_admin":
        return {}
    return {"organization": request.user.organization}


@api_view(["GET"])
@permission_classes([IsGymOwnerOrAdmin])
def organization_dashboard(request):
    org_filter = _org_filter(request)
    today = date.today()
    first_of_month = today.replace(day=1)

    active_members = Member.objects.filter(
        **org_filter, membership_status="active"
    ).count()

    new_members_this_month = Member.objects.filter(
        **org_filter, created_at__month=today.month, created_at__year=today.year
    ).count()

    revenue_this_month = (
        Payment.objects.filter(
            **org_filter,
            status="completed",
            paid_at__month=today.month,
            paid_at__year=today.year,
        ).aggregate(total=Sum("amount"))["total"]
        or 0
    )

    revenue_today = (
        Payment.objects.filter(
            **org_filter,
            status="completed",
            paid_at__date=today,
        ).aggregate(total=Sum("amount"))["total"]
        or 0
    )

    attendance_today = AttendanceLog.objects.filter(
        **org_filter, check_in_time__date=today
    ).count()

    expiring_this_month = MemberMembership.objects.filter(
        **org_filter,
        is_active=True,
        end_date__gte=today,
        end_date__lte=first_of_month + timedelta(days=30),
    ).count()

    branch_breakdown = list(
        Member.objects.filter(**org_filter)
        .values("branch__name")
        .annotate(count=Count("id"))
    )

    return Response(
        {
            "active_members": active_members,
            "new_members_this_month": new_members_this_month,
            "revenue_this_month": revenue_this_month,
            "revenue_today": revenue_today,
            "attendance_today": attendance_today,
            "expiring_this_month": expiring_this_month,
            "branch_breakdown": branch_breakdown,
        }
    )


@api_view(["GET"])
@permission_classes([IsGymOwnerOrAdmin])
def revenue_report(request):
    org_filter = _org_filter(request)
    period = request.query_params.get("period", "monthly")

    qs = Payment.objects.filter(**org_filter, status="completed")

    if period == "daily":
        from django.db.models.functions import TruncDate
        report = (
            qs.annotate(date=TruncDate("paid_at"))
            .values("date")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-date")[:30]
        )
    elif period == "monthly":
        from django.db.models.functions import TruncMonth
        report = (
            qs.annotate(month=TruncMonth("paid_at"))
            .values("month")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-month")[:12]
        )
    else:
        report = qs.aggregate(
            total_revenue=Sum("amount"), total_transactions=Count("id")
        )

    return Response(report)


@api_view(["GET"])
@permission_classes([IsGymOwnerOrAdmin])
def attendance_report(request):
    org_filter = _org_filter(request)
    days = int(request.query_params.get("days", 7))
    since = timezone.now() - timedelta(days=days)

    report = (
        AttendanceLog.objects.filter(
            **org_filter, check_in_time__gte=since
        )
        .extra({"date": "date(check_in_time)"})
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    return Response(list(report))
