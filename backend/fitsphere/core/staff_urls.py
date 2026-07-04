from django.urls import path

from . import views

urlpatterns = [
    path("", views.StaffListCreateView.as_view(), name="staff-list-create"),
    path("<int:pk>/", views.StaffDetailView.as_view(), name="staff-detail"),
]
