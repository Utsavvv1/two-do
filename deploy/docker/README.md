# Docker image (Docker Hub)

One container serves **two-do** on port **80**, **companion** on **8080**, and proxies **`/auth-api/`** to the **auth-server** on `127.0.0.1:8787` (same layout as the EC2 nginx setup).

Firebase **web** keys are **build arguments** (Vite embeds them). The Firebase **Admin** JSON file is a **runtime** mount (secret).

## 1. Build locally (you)

From the **repo root** (`two-do/`), with your real Firebase web config:

```bash
docker build \
  --build-arg VITE_FIREBASE_API_KEY="your-key" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com" \
  --build-arg VITE_FIREBASE_PROJECT_ID="your-project-id" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="123456789" \
  --build-arg VITE_FIREBASE_APP_ID="1:123:web:abc" \
  --build-arg VITE_FIREBASE_MEASUREMENT_ID="G-XXXX" \
  -t YOUR_DOCKERHUB_USER/two-do:latest .
```

Optional (defaults match `http://localhost` + `/auth-api/`):

- `VITE_AUTH_API_URL_TODO` (default `http://localhost/auth-api`)
- `VITE_AUTH_API_URL_COMPANION` (default `http://localhost:8080/auth-api`)

If your teacher will open the apps at **`http://127.0.0.1`** instead of `http://localhost`, rebuild with the same strings but using `127.0.0.1`, and run with:

`AUTH_ALLOWED_ORIGINS=http://127.0.0.1,http://127.0.0.1:8080`

## 2. Log in to Docker Hub

```bash
docker login
```

Use your Docker Hub **username** and a **Personal Access Token** (or password), not your GitHub password.

## 3. Tag and push

Replace `YOUR_DOCKERHUB_USER` with your Hub username (lowercase, no spaces):

```bash
docker tag YOUR_DOCKERHUB_USER/two-do:latest YOUR_DOCKERHUB_USER/two-do:latest
docker push YOUR_DOCKERHUB_USER/two-do:latest
```

Share the image name: `YOUR_DOCKERHUB_USER/two-do:latest`.

## 4. Teacher: run the image

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine (Linux).
2. Download the Firebase **service account JSON** you share out-of-band (class drive, email, etc.) — never commit it to git.
3. Run (adjust path to the JSON file):

```bash
docker pull YOUR_DOCKERHUB_USER/two-do:latest

docker run --init --rm -p 80:80 -p 8080:8080 \
  -e GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase.json \
  -v "/absolute/path/to/serviceAccount.json:/run/secrets/firebase.json:ro" \
  YOUR_DOCKERHUB_USER/two-do:latest
```

4. Open **http://localhost/** (two-do) and **http://localhost:8080/** (companion). Use **`localhost` for both**, not **`127.0.0.1`**, unless you rebuild with `VITE_AUTH_API_URL_*` using `127.0.0.1` (they are different origins and SSO breaks easily if you mix them).
5. In Firebase Console → Authentication → **Authorized domains**, add **`localhost`** (if not already).

`--init` helps signal handling for the Node + nginx process tree.

### Custom origins (e.g. teacher uses another host)

Set when running:

```bash
-e AUTH_ALLOWED_ORIGINS="http://host.docker.internal,http://host.docker.internal:8080"
```

…and the image must have been **built** with matching `VITE_AUTH_API_URL_*` values, or the browser will call the wrong auth URL.

## 5. Firebase rules

Teachers still need **Firestore rules** published in the Firebase project (see repo root `firestore.rules`).

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| Blank / auth errors | Build-args match the same Firebase project as the service account JSON |
| CORS / session | `AUTH_ALLOWED_ORIGINS` matches exactly what appears in the browser address bar (`http://localhost` vs `http://127.0.0.1`) |
| Port in use | Change mapping: `-p 8081:8080 -p 9080:80` then open `http://localhost:9080` and `http://localhost:8081` — you must **rebuild** with updated `VITE_AUTH_API_URL_*` for those ports |
| `net::ERR_BLOCKED_BY_CLIENT` on Firestore | Browser extension (uBlock, AdGuard, Brave Shields). Disable for **localhost** or use an **InPrivate/Incognito** window with extensions off — otherwise listens fail and the app looks “broken” after sign-in. |
| Login OK on **:8080** but not **:80** (or the reverse) | You’re mixing **`http://localhost`** and **`http://127.0.0.1`**. Use **only** `http://localhost` in both tabs, or only `http://127.0.0.1` in both and rebuild with matching `VITE_AUTH_API_URL_*` + `AUTH_ALLOWED_ORIGINS`. |
| `Cross-Origin-Opener-Policy` + `window.close` (Google popup) | Harmless Chrome noise for many setups; sign-in can still succeed. To avoid popups, use **email/password** for testing. |
## Optional: Docker Compose

Copy [`compose.example.yaml`](compose.example.yaml) to the **repo root** as `compose.yaml`, add a `.env` with your `VITE_FIREBASE_*`, `DOCKERHUB_USER`, and `FIREBASE_SERVICE_ACCOUNT_JSON_HOST_PATH`, then run `docker compose up --build`.
