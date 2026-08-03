from django.urls import path

from . import views

urlpatterns = [
    path("templates/", views.NotificationTemplateListView.as_view(), name="notif-templates"),
    path("email-logs/", views.EmailLogListView.as_view(), name="email-logs"),
    path("email-preview/", views.EmailPreviewView.as_view(), name="email-preview"),
    path(
        "preferences/",
        views.NotificationPreferenceListUpdateView.as_view(),
        name="notif-preferences",
    ),
]
