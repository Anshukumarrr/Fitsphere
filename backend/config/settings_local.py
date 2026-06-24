from .settings import *

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

CELERY_TASK_ALWAYS_EAGER = True
CELERY_BROKER_URL = None
CELERY_RESULT_BACKEND = None

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

APPS_TO_REMOVE = [
    "django_celery_beat",
    "django_celery_results",
    "django_extensions",
    "storages",
    "import_export",
]
INSTALLED_APPS = [a for a in INSTALLED_APPS if a not in APPS_TO_REMOVE]
