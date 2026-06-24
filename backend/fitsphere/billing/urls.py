from django.urls import path

from . import views

urlpatterns = [
    path("plans/", views.SubscriptionPlanListCreateView.as_view(), name="billing-plan-list"),
    path(
        "plans/<int:pk>/",
        views.SubscriptionPlanDetailView.as_view(),
        name="billing-plan-detail",
    ),
    path("subscriptions/", views.SubscriptionListView.as_view(), name="subscription-list"),
    path(
        "subscriptions/<int:pk>/",
        views.SubscriptionDetailView.as_view(),
        name="subscription-detail",
    ),
    path("invoices/", views.InvoiceListView.as_view(), name="invoice-list"),
]
