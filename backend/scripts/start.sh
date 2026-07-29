#!/bin/bash
set -e

celery -A config worker -B --pool=solo --loglevel=info &
CELERY_PID=$!

sleep 3
if ! kill -0 $CELERY_PID 2>/dev/null; then
    echo "Celery failed to start, aborting"
    exit 1
fi

gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120 &
GUNICORN_PID=$!

wait -n $GUNICORN_PID $CELERY_PID
kill $GUNICORN_PID $CELERY_PID 2>/dev/null
