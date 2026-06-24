from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/", views.organization_dashboard, name="analytics-dashboard"),
    path("revenue/", views.revenue_report, name="analytics-revenue"),
    path("attendance/", views.attendance_report, name="analytics-attendance"),
]
