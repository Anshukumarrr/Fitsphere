#!/bin/bash
set -e

# APScheduler runs in-process inside gunicorn (notifications/apps.py ready()).
# Single worker is REQUIRED: each gunicorn worker starts its own
# BackgroundScheduler, which would send duplicate reminder emails.
# gthread + threads keeps concurrency for API requests.
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 1 \
    --threads 4 \
    --worker-class gthread \
    --timeout 120
