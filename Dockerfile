# syntax=docker/dockerfile:1
# Build: pass Firebase web keys (Vite bakes them in). Run: mount service account JSON.
# See deploy/docker/README.md for Docker Hub and teacher run instructions.

FROM node:22-bookworm AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json eslint.config.js ./
COPY packages ./packages
COPY apps ./apps
COPY services/auth-server ./services/auth-server

RUN npm ci

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID=
ARG VITE_AUTH_API_URL_TODO=http://localhost/auth-api
ARG VITE_AUTH_API_URL_COMPANION=http://localhost:8080/auth-api

RUN test -n "${VITE_FIREBASE_API_KEY}" \
 && test -n "${VITE_FIREBASE_AUTH_DOMAIN}" \
 && test -n "${VITE_FIREBASE_PROJECT_ID}" \
 && test -n "${VITE_FIREBASE_STORAGE_BUCKET}" \
 && test -n "${VITE_FIREBASE_MESSAGING_SENDER_ID}" \
 && test -n "${VITE_FIREBASE_APP_ID}" \
 || (echo "Build failed: set all VITE_FIREBASE_* build-args (see deploy/docker/README.md)." && false)

RUN printf '%s\n' \
  "VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}" \
  "VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}" \
  "VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}" \
  "VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}" \
  "VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}" \
  "VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}" \
  "VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}" \
  "VITE_AUTH_API_URL=${VITE_AUTH_API_URL_TODO}" \
  > apps/two-do/.env.production

RUN printf '%s\n' \
  "VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}" \
  "VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}" \
  "VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}" \
  "VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}" \
  "VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}" \
  "VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}" \
  "VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}" \
  "VITE_AUTH_API_URL=${VITE_AUTH_API_URL_COMPANION}" \
  > apps/companion/.env.production

RUN npm run build

# --- runtime: nginx + static sites + Node auth-server ---
FROM node:22-bookworm-slim AS runtime

RUN apt-get update \
 && apt-get install -y --no-install-recommends nginx ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && rm -f /etc/nginx/sites-enabled/default

COPY deploy/docker/nginx-docker.conf /etc/nginx/conf.d/two-do.conf
COPY deploy/docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=builder /app/apps/two-do/dist /var/www/two-do
COPY --from=builder /app/apps/companion/dist /var/www/companion

WORKDIR /opt/auth-server
COPY services/auth-server/package.json ./
RUN npm install --omit=dev
COPY services/auth-server/src ./src

EXPOSE 80 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
