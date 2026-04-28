# two·do (monorepo)

A calm to-do app (**two·do**) and a second web app (**companion**), sharing one Firebase project. They can run on **separate ports** (or separate EC2 processes) and still share a login when you run the small **auth-server** (Firebase Admin session cookies).

![two-do aesthetic background](./apps/two-do/public/bg.jpg)

## Apps & packages

| Path | Role |
|------|------|
| `apps/two-do` | Task app (Firestore `tasks`) |
| `apps/companion` | Dashboard + quick notes (`companion_notes`) |
| `packages/shared` | Firebase client factory + `AuthProvider` / `useAuth` |
| `services/auth-server` | Optional SSO: session cookie + custom token for a second origin |

## Local dev (two ports + shared login)

1. **Firebase service account** (Project settings → Service accounts → Generate new private key). Never commit this file.

2. **Env for both frontends** — in `apps/two-do/.env.local` and `apps/companion/.env.local` add the same line (adjust port if you change `PORT`):

   ```env
   VITE_AUTH_API_URL=http://localhost:8787
   ```

   (Plus your existing `VITE_FIREBASE_*` variables.)

3. **Run the auth API** (from repo root):

   ```bash
   # Windows PowerShell example — path to your downloaded JSON
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
   npm run dev:auth
   ```

   Or set `FIREBASE_SERVICE_ACCOUNT_JSON` to the **raw JSON string** (common on servers).

4. **Run both UIs** (two terminals):

   ```bash
   npm run dev:todo
   npm run dev:companion
   ```

5. Open `http://localhost:5173`, sign in, then open `http://localhost:5174` — companion should pick up the session.

**CORS:** defaults allow `http://localhost:5173` and `http://localhost:5174`. Override with `AUTH_ALLOWED_ORIGINS` (comma-separated) on the auth server.

**Production / HTTPS:** set `COOKIE_SECURE=1`. If both apps share a parent domain (e.g. `app1.example.com` and `app2.example.com`), set `AUTH_COOKIE_DOMAIN=.example.com` on the auth server and include your real origins in `AUTH_ALLOWED_ORIGINS`.

If `VITE_AUTH_API_URL` is **omitted**, each app uses only the normal Firebase client session (separate login per port).

## EC2 / production

Step-by-step layout, nginx, systemd, env templates, and bash scripts live in **`deploy/ec2/`** (see `deploy/ec2/README.md`).

Quick build on the server or in CI:

```bash
npm run ec2:build
```

On Linux you can instead run `chmod +x deploy/ec2/*.sh && ./deploy/ec2/deploy.sh --stage` after configuring `.env.production` files and `services/auth-server/.env`.

## Docker (Docker Hub)

A single image serves both SPAs and the auth API behind nginx (`/auth-api/`). See **[`deploy/docker/README.md`](deploy/docker/README.md)** for **build-args**, **`docker push`**, and how your teacher should **`docker run`** with a mounted service account JSON.

## Firestore

Add rules for `companion_notes` (same pattern as `tasks`: only the owner’s `userId`).

## Build

```bash
npm run build
```

## Stack

React, TypeScript, Vite, Firebase Auth + Firestore, Framer Motion, Lucide; optional Express + `firebase-admin` for cross-origin SSO.
