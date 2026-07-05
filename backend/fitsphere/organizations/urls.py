from django.urls import path

from . import views

urlpatterns = [
    path("", views.SuperAdminOrganizationListView.as_view(), name="org-list"),
    path("my/", views.GymOrganizationDetailView.as_view(), name="org-my"),
    path(
        "<int:pk>/",
        views.SuperAdminOrganizationDetailView.as_view(),
        name="org-detail",
    ),
    path("branches/", views.BranchListCreateView.as_view(), name="branch-list"),
    path(
        "branches/<int:pk>/",
        views.BranchDetailView.as_view(),
        name="branch-detail",
    ),
    path("invites/", views.StaffInviteListCreateView.as_view(), name="invite-list"),
]
