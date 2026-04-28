#!/bin/sh
set -eu

if [ ! -f "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]; then
  echo "error: mount a Firebase service account JSON and set GOOGLE_APPLICATION_CREDENTIALS to its path inside the container."
  echo "example: docker run --init -e GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/sa.json -v /path/on/host/sa.json:/run/secrets/sa.json:ro ..."
  exit 1
fi

export PORT="${PORT:-8787}"
export AUTH_ALLOWED_ORIGINS="${AUTH_ALLOWED_ORIGINS:-http://localhost,http://localhost:8080}"
export NODE_ENV="${NODE_ENV:-production}"

cd /opt/auth-server
node src/index.js &
exec nginx -g "daemon off;"
