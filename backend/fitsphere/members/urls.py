from django.urls import path

from . import views

urlpatterns = [
    path("", views.MemberListCreateView.as_view(), name="member-list"),
    path("import/", views.BulkMemberImportView.as_view(), name="member-import"),
    path("<int:pk>/", views.MemberDetailView.as_view(), name="member-detail"),
    path(
        "<int:pk>/status/",
        views.MemberStatusChangeView.as_view(),
        name="member-status",
    ),
]
