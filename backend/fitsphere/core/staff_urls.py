from django.urls import path

from . import staff_views

urlpatterns = [
    path("", staff_views.StaffListCreateView.as_view(), name="staff-list-create"),
    path("<int:pk>/", staff_views.StaffDetailView.as_view(), name="staff-detail"),
]
