from django.urls import path

from . import views

urlpatterns = [
    path("", views.TrainerListCreateView.as_view(), name="trainer-list"),
    path("<int:pk>/", views.TrainerDetailView.as_view(), name="trainer-detail"),
    path(
        "branch/<int:branch_id>/",
        views.TrainerByBranchView.as_view(),
        name="trainer-by-branch",
    ),
]
