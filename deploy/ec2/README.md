# EC2 deployment (two·do + companion + auth-server)

Layout on the server (example):

```text
/opt/two-do/                 # git clone of this repo (or release tarball)
  apps/two-do/dist/          # produced by build
  apps/companion/dist/
  services/auth-server/      # Node process + .env
/var/www/two-do/             # nginx root (optional copy from dist)
/var/www/companion/
```

## Quick path

On Ubuntu EC2 (Node 20+ and nginx installed):

```bash
cd /opt/two-do
chmod +x deploy/ec2/*.sh

# 1) Production env for Vite (build-time) — create both files from deploy/ec2/env/frontends.build.env.example
nano apps/two-do/.env.production
nano apps/companion/.env.production

# 2) Auth server secrets (runtime)
cp deploy/ec2/env/auth-server.env.example services/auth-server/.env
nano services/auth-server/.env
mkdir -p /opt/two-do/secrets
# upload Firebase service account JSON, point GOOGLE_APPLICATION_CREDENTIALS at it

# 3) Build + copy static files
./deploy/ec2/deploy.sh --stage

# 4) Auth API as a service (edit paths in the unit file for your User/paths)
sudo cp deploy/ec2/systemd/two-do-auth.service.example /etc/systemd/system/two-do-auth.service
sudo nano /etc/systemd/system/two-do-auth.service
sudo systemctl daemon-reload
sudo systemctl enable --now two-do-auth

# 5) Nginx — merge deploy/ec2/nginx.example.conf into your site config, fix domains/paths, then:
sudo nginx -t && sudo systemctl reload nginx
```

## Scripts (run from anywhere; they `cd` to repo root)

| Script | Purpose |
|--------|---------|
| `deploy/ec2/build.sh` | `npm ci` + `npm run build` |
| `deploy/ec2/stage-static.sh` | `rsync` both `dist/` folders to `$STAGE_ROOT` (default `/var/www`) |
| `deploy/ec2/deploy.sh` | Build; add `--stage` to also run staging |
| `deploy/ec2/start-auth.sh` | Foreground auth-server (`NODE_ENV=production`) — for debugging |

Make executable: `chmod +x deploy/ec2/*.sh`

## Environment checklist

1. **Firebase Console → Authentication → Authorized domains** — add `todo.example.com`, `companion.example.com`, `auth.example.com`.
2. **`AUTH_ALLOWED_ORIGINS`** on auth-server — exact `https://…` origins users type in the browser.
3. **HTTPS** — set `COOKIE_SECURE=1` on auth-server when using TLS.
4. **Shared parent domain** — set `AUTH_COOKIE_DOMAIN=.example.com` when todo and companion are subdomains of `example.com`.
5. **`VITE_AUTH_API_URL`** in **both** `.env.production` files — public `https://auth.example.com` (no trailing slash).

## Ports-only (no DNS yet)

You can use `http://EC2_PUBLIC_IP:5173` style only for smoke tests; session cookies and `COOKIE_SECURE` are much simpler with proper HTTPS + hostnames. For class demos, use HTTP on one machine with `COOKIE_SECURE` unset and list exact `http://IP:port` entries in `AUTH_ALLOWED_ORIGINS`.

## Repo root npm shortcuts

From the project root (any OS):

```bash
npm run ec2:build    # npm ci + build both apps (for CI/EC2)
```

Use `deploy/ec2/build.sh` on Linux if you want a single bash entrypoint without relying on npm script names.
