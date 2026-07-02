from django.urls import path
from . import views

urlpatterns = [
    path("", views.TicketListCreateView.as_view(), name="ticket-list"),
    path("<int:pk>/", views.TicketDetailView.as_view(), name="ticket-detail"),
]
