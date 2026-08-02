import logging
import sys

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "fitsphere.notifications"
    label = "notifications"

    def ready(self):
        # ── Skip management commands (migrate, shell, test, etc.) ──────
        # Only start the scheduler when running as a WSGI app (gunicorn).
        if len(sys.argv) > 1 and "manage.py" in sys.argv[0]:
            logger.debug("Skipping APScheduler startup (manage.py %s)", sys.argv[1])
            return

        try:
            from .scheduler import start

            start()
        except Exception:
            logger.exception("Failed to start APScheduler")
