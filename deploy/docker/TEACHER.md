# two·do — Quick test (Docker)

Use these steps to run the student’s image on **your** computer. You need **Docker** and a small **Firebase service account** file the student will send you separately (not by public GitHub).

**Image name (student will fill in):** `pxrple1/two-do:latest`

---

## Part A — Install Docker

1. Install **Docker Desktop** (Windows or Mac):  
   https://www.docker.com/products/docker-desktop/
2. Start Docker and wait until it says it is **running** (whale icon idle).

---

## Part B — Get the secret key file

1. The student should send you a **Firebase service account JSON** file (e.g. `*-firebase-adminsdk-*.json`).
2. Save it somewhere easy to find, e.g.  
   - Windows: `C:\Users\YourName\Downloads\two-do-firebase.json`  
   - Mac: `/Users/YourName/Downloads/two-do-firebase.json`  
   **Do not** post this file publicly.

---

## Part C — Pull and run the container

### Windows (PowerShell)

```powershell
docker pull pxrple1/two-do:latest

docker run --init --rm -p 80:80 -p 8080:8080 `
  -e GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase.json `
  -v "C:\Users\YourName\Downloads\two-do-firebase.json:/run/secrets/firebase.json:ro" `
  pxrple1/two-do:latest
```

Change the path in `-v "..."` to **your actual JSON path**.

Leave this window **open** while testing. **Ctrl+C** stops the app.

### Mac or Linux (Terminal)

```bash
docker pull pxrple1/two-do:latest

docker run --init --rm -p 80:80 -p 8080:8080 \
  -e GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase.json \
  -v "/Users/YourName/Downloads/two-do-firebase.json:/run/secrets/firebase.json:ro" \
  pxrple1/two-do:latest
```

---

## Part D — Open the two apps

In the browser, use **exactly** these (avoid mixing with `127.0.0.1`):

| App       | URL                         |
|-----------|-----------------------------|
| **two·do** (tasks) | http://localhost/           |
| **companion**      | http://localhost:8080/      |

If **port 80 or 8080 is already in use** on your machine, ask the student for an alternate `docker run` command with different `-p` mappings (they may need to give you a different image build).

---

## Part E — If sign-in or data fails

1. **Firebase console** (student’s project): **Authentication → Settings → Authorized domains** — ensure **`localhost`** is listed.
2. **Firestore rules** — the student should have published rules so signed-in users only see their own data (they can point you to `firestore.rules` in the repo).
3. **Browser extensions** — ad blockers (uBlock, etc.) sometimes block Firebase. Try **Incognito/Private** with extensions **off**, or disable blocking for **localhost**.
4. If Google sign-in popups act odd, try **email/password** if the app offers it.

---

## What “success” looks like

- Both URLs load the UI (not “connection refused”).
- You can sign in (Google or email, depending on what the student enabled).
- Tasks load on **two·do**; notes load on **companion**.
- Signing in on one app and opening the other in the **same** browser often shows you already signed in (shared login / SSO).

---

## Stop the app

In the terminal where the container is running, press **Ctrl+C**.

---

*Technical reference for the student: [`deploy/docker/README.md`](README.md).*
