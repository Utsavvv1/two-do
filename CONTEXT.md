# Project context (architecture & deployment summary)

This file captures how the **two·do** monorepo is structured, how **shared login** works across two separate apps, and how to run it **locally** and on **EC2**. It reflects the decisions and setup discussed during implementation—not a substitute for `README.md` or `deploy/ec2/README.md`.

---

## Repository layout

| Path | Purpose |
|------|---------|
| `apps/two-do` | Main task app (Vite + React). Firestore collection `tasks`, `userId` = Firebase `uid`. |
| `apps/companion` | Second app: dashboard, quick notes in `companion_notes`, link to two·do. Same Firebase project. |
| `packages/shared` | `@two-do/shared`: `createFirebaseClients()`, `AuthProvider`, `useAuth`. |
| `services/auth-server` | Small Express + **Firebase Admin** API for **cross-origin SSO** (session cookie + custom token). |
| `deploy/ec2/` | Bash scripts (`build.sh`, `stage-static.sh`, `deploy.sh`), nginx/systemd **examples**, env templates. |

Root **`npm run ec2:build`** runs `npm ci && npm run build` (both SPAs only; auth-server has no separate build step).

---

## Why two ports did not share login by default

The Firebase **web** SDK persists the session in **per-origin** browser storage (IndexedDB).  
`http://localhost:5173` and `http://localhost:5174` (or two different ports on the same IP) are **different origins** → two independent Firebase sessions.

**Rejected approach:** Serving companion under `/companion` on the **same** port as two·do (same origin). That fixed local SSO without a backend but felt like “one app” and was removed per preference.

**Chosen approach:** A dedicated **auth-server** that:

1. Accepts a Firebase **ID token** after client sign-in, creates a **session cookie** (Admin SDK).
2. On each app load, the client calls **`GET /session`** with `credentials: 'include'`; if valid, the server returns a **custom token** and the client runs `signInWithCustomToken`.
3. **Logout** clears the cookie (`POST /logout`) and signs out Firebase locally.
4. **`AuthProvider`** (when `VITE_AUTH_API_URL` is set) also **polls** `GET /session` on focus / visibility / ~12s interval so logging out in one tab eventually signs the other app out when the cookie is gone.

Env:

- **Both frontends:** `VITE_AUTH_API_URL` = public base URL of the auth API (usually **the same** in both apps, e.g. `http://localhost:8787` or `http://IP:8787`). On EC2 with an nginx **/auth-api/** proxy, use **per-app** URLs: `http://IP/auth-api` (two-do) and `http://IP:8080/auth-api` (companion). Omit for client-only Firebase (separate logins per origin).
- **Auth server:** `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_SERVICE_ACCOUNT_JSON`, `AUTH_ALLOWED_ORIGINS`, optional `PORT`, `COOKIE_SECURE` (HTTPS only), optional `AUTH_COOKIE_DOMAIN` (subdomains of one domain).

Auth-server loads env from: repo root `.env` / `.env.local`, then `services/auth-server/.env` / `.env.local` (package overrides).

---

## Local development

1. `apps/two-do/.env.local` and `apps/companion/.env.local`: Firebase `VITE_*` keys + `VITE_AUTH_API_URL=http://localhost:8787` (if using SSO).
2. `services/auth-server/.env`: service account path (or inline JSON—single line is safest).
3. Three processes: `npm run dev:auth`, `npm run dev:todo`, `npm run dev:companion`.

CORS defaults on auth-server: `http://localhost:5173`, `http://localhost:5174` unless overridden with `AUTH_ALLOWED_ORIGINS`.

---

## EC2 / Elastic IP (HTTP, no domain yet)—simplest pattern

- **Nginx** serves two·do on **port 80** → origin `http://ELASTIC_IP`.
- **Nginx** serves companion on **another port** (e.g. **8080**) → origin `http://ELASTIC_IP:8080`.
- **Auth-server** on **8787** on localhost, exposed either:
  - **Direct:** open SG **8787**; `VITE_AUTH_API_URL=http://ELASTIC_IP:8787` in **both** apps’ `.env.production`, or  
  - **Proxied (recommended if 8787 is blocked):** nginx `location /auth-api/` → `127.0.0.1:8787` on **both** port 80 and 8080 server blocks ([`deploy/ec2/nginx.http-ip.example.conf`](deploy/ec2/nginx.http-ip.example.conf)); then **two-do** uses `http://ELASTIC_IP/auth-api` and **companion** uses `http://ELASTIC_IP:8080/auth-api` ([`deploy/ec2/env/frontends.build.env.example`](deploy/ec2/env/frontends.build.env.example)).

Then:

```env
AUTH_ALLOWED_ORIGINS=http://ELASTIC_IP,http://ELASTIC_IP:8080
# Direct: VITE_AUTH_API_URL=http://ELASTIC_IP:8787 in both apps
# Proxy:  http://ELASTIC_IP/auth-api (two-do) and http://ELASTIC_IP:8080/auth-api (companion)
```

**Do not** set `COOKIE_SECURE=1` until the site is **HTTPS**.  
**Do not** set `AUTH_COOKIE_DOMAIN` when using a **bare IP** (that variable is for shared parent domains like `.example.com`).

Build with `apps/*/.env.production` filled, then use `deploy/ec2/` scripts or `npm run ec2:build` + copy `dist/` to nginx roots. Clone path on server may be nested (e.g. `/opt/two-do/two-do`); run deploy commands from the directory that contains root **`package.json`**.

---

## Firebase Console reminders

- **Authorized domains:** include every host/port users hit (and auth host if different).
- **Firestore rules:** scope `tasks` and `companion_notes` by `request.auth.uid` / `userId` like the app code expects.

---

## Copying secrets to EC2

Use **`scp`** (or `sftp`) **from your laptop** to upload the service account JSON; avoid committing it. Prefer **`GOOGLE_APPLICATION_CREDENTIALS=/path/to/file.json`** over huge inline JSON in `.env`.

---

## Useful commands (reference)

| Command | Meaning |
|---------|---------|
| `npm run dev:todo` | two·do Vite dev (5173). |
| `npm run dev:companion` | companion Vite dev (5174). |
| `npm run dev:auth` | auth-server with watch. |
| `npm run build` | Production build of both SPAs. |
| `npm run ec2:build` | `npm ci` + build (CI / clean server). |
| `./deploy/ec2/deploy.sh --stage` | Build + rsync to `/var/www` (Linux, after `chmod +x`). |

---

## Particle / lint note (two·do)

Random particle positions for the home background live in `apps/two-do/src/particleStyles.ts` (module scope) to satisfy React Compiler / purity lint rules.

---

*End of context file. Update this document when deployment or auth flow changes materially.*
