from django.urls import path

from . import views

urlpatterns = [
    path("qr-codes/", views.QRCodeListCreateView.as_view(), name="qr-list"),
    path("logs/", views.AttendanceLogListView.as_view(), name="attendance-list"),
    path("check-in/qr/", views.qr_check_in, name="qr-check-in"),
    path("check-in/manual/", views.manual_check_in, name="manual-check-in"),
    path("codes/generate/", views.generate_code, name="attendance-generate-code"),
    path("codes/active/", views.active_code, name="attendance-active-code"),
    path("check-in/code/", views.code_check_in, name="attendance-code-checkin"),
]
