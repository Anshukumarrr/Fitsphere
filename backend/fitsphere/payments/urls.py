from django.urls import path

from . import views
from .razorpay_views import CreateOrderView, VerifyPaymentView

urlpatterns = [
    path("", views.PaymentListCreateView.as_view(), name="payment-list"),
    path("<int:pk>/", views.PaymentDetailView.as_view(), name="payment-detail"),
    path("razorpay/create-order/", CreateOrderView.as_view(), name="razorpay-create-order"),
    path("razorpay/verify/", VerifyPaymentView.as_view(), name="razorpay-verify"),
]
