from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("verify-email/", views.VerifyEmailView.as_view(), name="auth-verify-email"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", views.CurrentUserView.as_view(), name="auth-me"),
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("users/<int:pk>/", views.UserDetailView.as_view(), name="user-detail"),
    path("receptionists/", views.ReceptionistListCreateView.as_view(), name="receptionist-list-create"),
]
