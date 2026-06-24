from django.urls import path

from . import views

urlpatterns = [
    path("", views.MemberListCreateView.as_view(), name="member-list"),
    path("<int:pk>/", views.MemberDetailView.as_view(), name="member-detail"),
    path(
        "<int:pk>/status/",
        views.MemberStatusChangeView.as_view(),
        name="member-status",
    ),
]
