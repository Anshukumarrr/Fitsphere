from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

api_urlpatterns = [
    path("auth/", include("fitsphere.core.urls")),
    path("organizations/", include("fitsphere.organizations.urls")),
    path("members/", include("fitsphere.members.urls")),
    path("trainers/", include("fitsphere.trainers.urls")),
    path("memberships/", include("fitsphere.memberships.urls")),
    path("attendance/", include("fitsphere.attendance.urls")),
    path("personal-training/", include("fitsphere.personal_training.urls")),
    path("payments/", include("fitsphere.payments.urls")),
    path("notifications/", include("fitsphere.notifications.urls")),
    path("analytics/", include("fitsphere.analytics.urls")),
    path("billing/", include("fitsphere.billing.urls")),
    path("audit/", include("fitsphere.audit.urls")),
    path("tickets/", include("fitsphere.tickets.urls")),
    path("staff/", include("fitsphere.core.staff_urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_urlpatterns)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
