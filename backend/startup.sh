#!/bin/bash
# Azure App Service startup script for the DevTracker FastAPI backend.
# Azure sets the PORT environment variable automatically (usually 8000).
# Gunicorn + Uvicorn workers gives you production-grade concurrency.

PORT=${PORT:-8000}

exec gunicorn main:app \
  --bind "0.0.0.0:${PORT}" \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --timeout 120 \
  --keep-alive 5 \
  --log-level info \
  --access-logfile - \
  --error-logfile -
