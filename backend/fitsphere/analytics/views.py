from datetime import date, timedelta

from django.db.models import Count, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from ..core.permissions import IsGymOwnerOrAdmin, IsMember, IsSuperAdmin, get_staff_branch
from ..members.models import Member
from ..payments.models import Payment
from ..attendance.models import AttendanceLog
from ..memberships.models import MemberMembership
from ..personal_training.models import PTSession


def _org_filter(request, for_membership=False):
    if request.user.role == "super_admin":
        return {}
    filters = {"organization": request.user.organization}
    if request.user.role == "manager":
        branch = get_staff_branch(request.user)
        if branch:
            if for_membership:
                filters["member__branch"] = branch
            else:
                filters["branch"] = branch
    return filters


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

    membership_filter = _org_filter(request, for_membership=True)
    expiring_this_month = MemberMembership.objects.filter(
        **membership_filter,
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
        report = (
            qs.annotate(date=TruncDate("paid_at"))
            .values("date")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-date")[:30]
        )
    elif period == "monthly":
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
@permission_classes([IsMember])
def member_dashboard(request):
    try:
        member = request.user.member_profile
    except Member.DoesNotExist:
        return Response(
            {"error": "Member profile not found."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    today = date.today()
    first_of_month = today.replace(day=1)

    total_check_ins = AttendanceLog.objects.filter(member=member).count()
    check_ins_this_month = AttendanceLog.objects.filter(
        member=member, check_in_time__date__gte=first_of_month
    ).count()

    logs = (
        AttendanceLog.objects.filter(member=member)
        .dates("check_in_time", "day")
        .order_by("-check_in_time")
    )
    streak = 0
    check = today
    for log_date in logs:
        if log_date == check:
            streak += 1
            check -= timedelta(days=1)
        elif log_date < check:
            break

    upcoming_sessions = list(
        PTSession.objects.filter(
            member=member,
            scheduled_date__gte=today,
            status="scheduled",
        )
        .order_by("scheduled_date", "scheduled_time")
        .values("id", "scheduled_date", "scheduled_time", "trainer__user__first_name", "trainer__user__last_name")[:3]
    )

    return Response({
        "total_check_ins": total_check_ins,
        "check_ins_this_month": check_ins_this_month,
        "streak": streak,
        "upcoming_sessions": [
            {
                "id": s["id"],
                "scheduled_date": s["scheduled_date"],
                "scheduled_time": s["scheduled_time"],
                "trainer_name": f"{s['trainer__user__first_name']} {s['trainer__user__last_name']}",
            }
            for s in upcoming_sessions
        ],
    })


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
        .annotate(date=TruncDate("check_in_time"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    return Response(list(report))


@api_view(["GET"])
@permission_classes([IsSuperAdmin])
def platform_dashboard(request):
    from django.db.models.functions import TruncMonth
    from ..organizations.models import GymOrganization
    today = date.today()
    first_of_month = today.replace(day=1)
    last_month_end = first_of_month - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    data = []
    for org in GymOrganization.objects.filter(is_active=True):
        org_filter = {"organization": org}

        members_qs = org.users.filter(role="member")
        total_members = members_qs.count()
        new_members = members_qs.filter(
            date_joined__month=today.month, date_joined__year=today.year
        ).count()
        members_last_month = members_qs.filter(
            date_joined__lte=last_month_end
        ).count()

        revenue_qs = org.users.filter(
            role="member",
            member_profile__payments__status="completed",
            member_profile__payments__paid_at__month=today.month,
            member_profile__payments__paid_at__year=today.year,
        )
        revenue_this_month = (
            revenue_qs.aggregate(total=Sum("member_profile__payments__amount"))["total"]
            or 0
        )

        revenue_last_month_qs = org.users.filter(
            role="member",
            member_profile__payments__status="completed",
            member_profile__payments__paid_at__month=last_month_start.month,
            member_profile__payments__paid_at__year=last_month_start.year,
        )
        revenue_last_month = (
            revenue_last_month_qs.aggregate(total=Sum("member_profile__payments__amount"))["total"]
            or 0
        )

        data.append({
            "gym_id": org.id,
            "gym_name": org.name,
            "total_members": total_members,
            "new_members_this_month": new_members,
            "members_last_month": members_last_month,
            "member_growth": round(
                ((total_members - members_last_month) / max(members_last_month, 1)) * 100, 1
            ),
            "revenue_this_month": float(revenue_this_month),
            "revenue_last_month": float(revenue_last_month),
            "revenue_growth": round(
                ((revenue_this_month - revenue_last_month) / max(revenue_last_month, 1)) * 100, 1
            ),
        })

    return Response(data)
