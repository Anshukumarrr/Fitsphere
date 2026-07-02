from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/", views.organization_dashboard, name="analytics-dashboard"),
    path("member-dashboard/", views.member_dashboard, name="analytics-member-dashboard"),
    path("revenue/", views.revenue_report, name="analytics-revenue"),
    path("attendance/", views.attendance_report, name="analytics-attendance"),
    path("platform/", views.platform_dashboard, name="analytics-platform"),
]
