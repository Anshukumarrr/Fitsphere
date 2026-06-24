from django.urls import path

from . import views

urlpatterns = [
    path("", views.SuperAdminAuditLogListView.as_view(), name="audit-list"),
    path("org/", views.OrgAuditLogListView.as_view(), name="audit-org"),
]
