from django.urls import path

from . import views

urlpatterns = [
    path("templates/", views.NotificationTemplateListView.as_view(), name="notif-templates"),
    path("email-logs/", views.EmailLogListView.as_view(), name="email-logs"),
    path(
        "preferences/",
        views.NotificationPreferenceListUpdateView.as_view(),
        name="notif-preferences",
    ),
]
