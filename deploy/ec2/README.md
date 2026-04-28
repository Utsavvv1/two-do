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

On **Ubuntu** or **Amazon Linux 2023** EC2 (Node 20+ and nginx installed). On AL2023 the stock `/etc/nginx/nginx.conf` often includes a second `server { listen 80; ... }` after `include /etc/nginx/conf.d/*.conf;`, which duplicates port 80. Run `deploy/ec2/fix-nginx-main.sh` once (or delete that block by hand) so only `conf.d` owns ports 80/8080. Use `deploy/ec2/nginx.http-ip.example.conf` as a template for HTTP + bare IP before you add TLS.

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

1. **Firebase Console → Authentication → Authorized domains** — add every browser origin you use (hostnames such as `todo.example.com`, or your **EC2 public IP** for `http://IP` / `http://IP:8080` demos). Add the auth API host if it differs (e.g. `http://IP:8787` is usually not required for Firebase client config, but the IP must be authorized for Google sign-in on that host).
2. **Firestore rules** — deploy the rules in the repo root [`firestore.rules`](../../firestore.rules) (paste into the Firebase console Rules tab or use the Firebase CLI when you add `firebase.json`).
3. **`AUTH_ALLOWED_ORIGINS`** on auth-server — exact `https://…` or `http://IP:port` origins users type in the browser.
4. **HTTPS** — set `COOKIE_SECURE=1` on auth-server when using TLS.
5. **Shared parent domain** — set `AUTH_COOKIE_DOMAIN=.example.com` when todo and companion are subdomains of `example.com`.
6. **`VITE_AUTH_API_URL`** in **both** `.env.production` files — same scheme/host as the auth API (e.g. `http://YOUR_IP:8787` over HTTP, or `https://auth.example.com` with TLS). **Do not** mix `https://…` here while the API is only serving HTTP.

## Ports-only (no DNS yet)

You can use `http://EC2_PUBLIC_IP:5173` style only for smoke tests; session cookies and `COOKIE_SECURE` are much simpler with proper HTTPS + hostnames. For class demos, use HTTP on one machine with `COOKIE_SECURE` unset and list exact `http://IP:port` entries in `AUTH_ALLOWED_ORIGINS`.

## Repo root npm shortcuts

From the project root (any OS):

```bash
npm run ec2:build    # npm ci + build both apps (for CI/EC2)
```

Use `deploy/ec2/build.sh` on Linux if you want a single bash entrypoint without relying on npm script names.
