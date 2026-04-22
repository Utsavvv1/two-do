import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, '..');
const repoRoot = join(__dirname, '..', '..', '..');

function loadEnv() {
  // Least specific first; package .env / .env.local override (so auth-server wins over root).
  dotenv.config({ path: join(repoRoot, '.env') });
  dotenv.config({ path: join(repoRoot, '.env.local') });
  dotenv.config({ path: join(pkgRoot, '.env'), override: true });
  dotenv.config({ path: join(pkgRoot, '.env.local'), override: true });
}

loadEnv();

const PORT = Number(process.env.PORT) || 8787;
const COOKIE_NAME = '__session';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5; // 5 days (within Firebase limits)

/** Comma-separated list, e.g. http://localhost:5173,http://localhost:5174 */
const ALLOWED_ORIGINS = (process.env.AUTH_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const COOKIE_SECURE = process.env.COOKIE_SECURE === '1';
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || undefined;

function initFirebaseAdmin() {
  if (getApps().length) return;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (json) {
    initializeApp({ credential: cert(JSON.parse(json)) });
    return;
  }
  if (path) {
    const sa = JSON.parse(readFileSync(path, 'utf8'));
    initializeApp({ credential: cert(sa) });
    return;
  }

  const hasGac = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const hasJson = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  throw new Error(
    [
      'Firebase Admin needs credentials (none loaded).',
      '',
      'Add this line to EITHER file (create the file if needed):',
      `  • ${join(pkgRoot, '.env')} or .env.local`,
      `  • ${join(repoRoot, '.env.local')}   ← often easiest (same folder as your apps)`,
      '',
      'Line to add (use your real path to the Firebase service account JSON):',
      '  GOOGLE_APPLICATION_CREDENTIALS=C:/Users/you/keys/your-project-firebase-adminsdk-xxxxx.json',
      '',
      'Get the JSON: Firebase Console → Project settings → Service accounts → Generate new private key.',
      '',
      `Checked env: GOOGLE_APPLICATION_CREDENTIALS=${hasGac ? 'set' : 'missing'}, FIREBASE_SERVICE_ACCOUNT_JSON=${hasJson ? 'set' : 'missing'}.`,
    ].join('\n'),
  );
}

initFirebaseAdmin();
const adminAuth = getAuth();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      console.warn(`CORS blocked origin: ${origin}`);
      return cb(null, false);
    },
    credentials: true,
  }),
);

const cookieOpts = {
  maxAge: SESSION_MAX_AGE_MS,
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: 'lax',
  path: '/',
  ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
};

/** Exchange Firebase ID token (from client) for HTTP-only session cookie */
app.post('/session', async (req, res) => {
  const idToken = req.body?.idToken;
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ error: 'idToken required' });
  }
  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });
    res.cookie(COOKIE_NAME, sessionCookie, cookieOpts);
    return res.status(204).end();
  } catch (e) {
    console.error('createSessionCookie', e);
    return res.status(401).json({ error: 'Invalid or expired id token' });
  }
});

/** Return a custom token if session cookie is valid (second app signs in with this) */
app.get('/session', async (req, res) => {
  const sessionCookie = req.cookies[COOKIE_NAME];
  if (!sessionCookie) return res.status(401).end();
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const customToken = await adminAuth.createCustomToken(decoded.uid);
    return res.json({ customToken });
  } catch (e) {
    console.warn('verifySessionCookie', e?.message || e);
    return res.status(401).end();
  }
});

app.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  });
  return res.status(204).end();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`@two-do/auth-server listening on http://127.0.0.1:${PORT}`);
  console.log(`Allowed CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
