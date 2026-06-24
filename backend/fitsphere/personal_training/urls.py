from django.urls import path

from . import views

urlpatterns = [
    path("packages/", views.PTPackageListCreateView.as_view(), name="pt-package-list"),
    path(
        "packages/<int:pk>/",
        views.PTPackageDetailView.as_view(),
        name="pt-package-detail",
    ),
    path(
        "memberships/",
        views.PTMembershipListCreateView.as_view(),
        name="pt-membership-list",
    ),
    path(
        "memberships/<int:pk>/",
        views.PTMembershipDetailView.as_view(),
        name="pt-membership-detail",
    ),
    path("sessions/", views.PTSessionListCreateView.as_view(), name="pt-session-list"),
    path(
        "sessions/<int:pk>/",
        views.PTSessionDetailView.as_view(),
        name="pt-session-detail",
    ),
]
