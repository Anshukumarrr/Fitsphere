import logging

import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import redirect
from django.template.loader import render_to_string
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import EmailVerificationToken, PasswordResetToken

from .serializers import (
    LoginSerializer,
    ReceptionistCreateSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .permissions import IsGymOwnerOrAdmin, IsGymOwnerOrManager, IsSuperAdmin

User = get_user_model()
logger = logging.getLogger(__name__)


class RegisterThrottle(AnonRateThrottle):
    rate = "10/hour"


class LoginThrottle(AnonRateThrottle):
    rate = "10/min"


class ResendVerificationThrottle(AnonRateThrottle):
    rate = "3/hour"


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    throttle_classes = [RegisterThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = secrets.token_urlsafe(32)
        EmailVerificationToken.objects.update_or_create(
            user=user, defaults={"token": token}
        )

        verify_url = request.build_absolute_uri(
            f"/api/v1/auth/verify-email/?token={token}&uid={user.id}"
        )

        try:
            html_body = render_to_string("emails/verify_email.html", {
                "name": user.first_name or user.username,
                "verify_url": verify_url,
            })
            text_body = render_to_string("emails/verify_email.txt", {
                "name": user.first_name or user.username,
                "verify_url": verify_url,
            })
            msg = EmailMultiAlternatives(
                subject="Verify your FitSphere email address",
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
        except Exception:
            logger.exception("Failed to send verification email")

        return Response(
            {
                "detail": "Account created. Check your email to verify your account.",
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class ResendVerificationView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [ResendVerificationThrottle]

    def post(self, request):
        email = request.data.get("email", "")
        try:
            user = User.objects.get(email=email, is_active=False)
        except User.DoesNotExist:
            return Response(
                {"detail": "If the account exists and is unverified, a new verification email will be sent."},
                status=status.HTTP_200_OK,
            )

        token = secrets.token_urlsafe(32)
        EmailVerificationToken.objects.update_or_create(
            user=user, defaults={"token": token}
        )

        verify_url = request.build_absolute_uri(
            f"/api/v1/auth/verify-email/?token={token}&uid={user.id}"
        )

        try:
            html_body = render_to_string("emails/verify_email.html", {
                "name": user.first_name or user.username,
                "verify_url": verify_url,
            })
            text_body = render_to_string("emails/verify_email.txt", {
                "name": user.first_name or user.username,
                "verify_url": verify_url,
            })
            msg = EmailMultiAlternatives(
                subject="Verify your FitSphere email address",
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
        except Exception:
            logger.exception("Failed to send verification email")

        return Response(
            {"detail": "If the account exists and is unverified, a new verification email will be sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    throttle_classes = [RegisterThrottle]

    def post(self, request):
        email = request.data.get("email", "")
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"detail": "If an account with that email exists, a password reset link has been sent."},
                status=status.HTTP_200_OK,
            )

        token = secrets.token_urlsafe(32)
        PasswordResetToken.objects.create(user=user, token=token)

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}&uid={user.id}"

        try:
            html_body = render_to_string("emails/password_reset.html", {
                "name": user.first_name or user.username,
                "reset_url": reset_url,
            })
            text_body = render_to_string("emails/password_reset.txt", {
                "name": user.first_name or user.username,
                "reset_url": reset_url,
            })
            msg = EmailMultiAlternatives(
                subject="Reset your FitSphere password",
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
        except Exception:
            logger.exception("Failed to send password reset email")

        return Response(
            {"detail": "If an account with that email exists, a password reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get("token", "")
        uid = request.data.get("uid", "")
        password = request.data.get("password", "")

        if not token or not uid or not password:
            return Response(
                {"detail": "Token, uid, and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            uid = int(uid)
        except (ValueError, TypeError):
            return Response(
                {"detail": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(pk=uid, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            reset_token = PasswordResetToken.objects.get(
                user=user, token=token, is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reset_token.is_expired():
            return Response(
                {"detail": "Reset link has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save(update_fields=["password"])
        reset_token.is_used = True
        reset_token.save(update_fields=["is_used"])

        return Response(
            {"detail": "Password has been reset successfully."},
            status=status.HTTP_200_OK,
        )


class VerifyEmailView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, *args, **kwargs):
        token = request.query_params.get("token")
        uid = request.query_params.get("uid")

        if not token or not uid:
            return redirect(f"{settings.FRONTEND_URL}/login?verified=invalid")

        try:
            uid = int(uid)
        except (ValueError, TypeError):
            return redirect(f"{settings.FRONTEND_URL}/login?verified=invalid")

        try:
            user = User.objects.get(pk=uid, is_active=False)
        except User.DoesNotExist:
            return redirect(f"{settings.FRONTEND_URL}/login?verified=invalid")

        try:
            verification = EmailVerificationToken.objects.get(user=user, token=token)
        except EmailVerificationToken.DoesNotExist:
            return redirect(f"{settings.FRONTEND_URL}/login?verified=invalid")

        if verification.is_expired():
            verification.delete()
            return redirect(f"{settings.FRONTEND_URL}/login?verified=expired")

        user.is_active = True
        user.save(update_fields=["is_active"])
        verification.delete()

        refresh = RefreshToken.for_user(user)
        return redirect(
            f"{settings.FRONTEND_URL}/dashboard?access={refresh.access_token}&refresh={refresh}"
        )


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    throttle_classes = [LoginThrottle]


class LogoutView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except TokenError:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    queryset = User.objects.select_related("member_profile", "organization").all()
    serializer_class = UserSerializer
    permission_classes = (IsSuperAdmin,)
    filterset_fields = ("role", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsSuperAdmin,)


class ReceptionistListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsGymOwnerOrAdmin,)

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsGymOwnerOrManager()]
        return [IsGymOwnerOrAdmin()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReceptionistCreateSerializer
        from .serializers import UserSerializer
        return UserSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = getattr(self.request.user, "organization", None)
        context["created_by"] = self.request.user
        return context

    def get_queryset(self):
        from .models import ReceptionistProfile
        user = self.request.user
        if user.role == "super_admin":
            return ReceptionistProfile.objects.select_related("user", "branch").all()
        return ReceptionistProfile.objects.select_related("user", "branch").filter(
            user__organization=user.organization
        )

    def perform_create(self, serializer):
        profile = serializer.save()
        self._send_receptionist_verify_email(profile)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        from .serializers import UserSerializer
        return Response(
            UserSerializer(serializer.instance.user).data,
            status=status.HTTP_201_CREATED,
        )

    def _send_receptionist_verify_email(self, profile):
        user = profile.user
        user.is_active = False
        user.save(update_fields=["is_active"])
        token = secrets.token_urlsafe(32)
        EmailVerificationToken.objects.update_or_create(user=user, defaults={"token": token})
        verify_url = self.request.build_absolute_uri(
            f"/api/v1/auth/verify-email/?token={token}&uid={user.id}"
        )
        try:
            html_body = render_to_string("emails/verify_email.html", {
                "name": user.first_name or user.username,
                "verify_url": verify_url,
            })
            text_body = render_to_string("emails/verify_email.txt", {
                "name": user.first_name or user.username,
                "verify_url": verify_url,
            })
            msg = EmailMultiAlternatives(
                subject="Verify your FitSphere email address",
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send(fail_silently=False)
        except Exception:
            logger.exception("Failed to send receptionist verification email")



