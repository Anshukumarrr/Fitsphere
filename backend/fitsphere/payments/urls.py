from django.urls import path

from . import views

urlpatterns = [
    path("", views.PaymentListCreateView.as_view(), name="payment-list"),
    path("<int:pk>/", views.PaymentDetailView.as_view(), name="payment-detail"),
]
