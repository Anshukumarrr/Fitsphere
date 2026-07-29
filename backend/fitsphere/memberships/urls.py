from django.urls import path

from . import views

urlpatterns = [
    path("plans/", views.MembershipPlanListCreateView.as_view(), name="plan-list"),
    path(
        "plans/<int:pk>/",
        views.MembershipPlanDetailView.as_view(),
        name="plan-detail",
    ),
    path(
        "memberships/",
        views.MemberMembershipListCreateView.as_view(),
        name="membership-list",
    ),
    path(
        "memberships/<int:pk>/",
        views.MemberMembershipDetailView.as_view(),
        name="membership-detail",
    ),
    path(
        "members/<int:member_id>/active/",
        views.ActiveMembershipByMemberView.as_view(),
        name="member-active-membership",
    ),
    path(
        "my-memberships/<int:pk>/",
        views.MyMembershipDetailView.as_view(),
        name="my-membership-detail",
    ),
]
