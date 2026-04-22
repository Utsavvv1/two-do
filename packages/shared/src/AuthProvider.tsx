import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import type { Auth, GoogleAuthProvider, User } from 'firebase/auth';
import { AuthContext } from './authContext';

export type SessionSyncConfig = {
  apiBaseUrl: string;
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  auth: Auth;
  googleProvider: GoogleAuthProvider;
  /** Optional: Firebase Admin session cookie API so two origins (e.g. two ports) share login. */
  sessionSync?: SessionSyncConfig;
}> = ({ children, auth, googleProvider, sessionSync }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const apiBase = sessionSync?.apiBaseUrl;

  const persistServerSession = async () => {
    if (!apiBase) return;
    const u = auth.currentUser;
    if (!u) return;
    const idToken = await u.getIdToken();
    await fetch(`${apiBase}/session`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  };

  const clearServerSession = async () => {
    if (!apiBase) return;
    try {
      await fetch(`${apiBase}/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      if (apiBase) {
        try {
          const r = await fetch(`${apiBase}/session`, { credentials: 'include' });
          if (r.ok) {
            const data: { customToken?: string } = await r.json();
            if (data.customToken && !cancelled) {
              await signInWithCustomToken(auth, data.customToken);
            }
          }
        } catch {
          /* API unreachable — fall back to client-only Firebase */
        }
      }

      if (cancelled) return;

      unsub = onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [auth, apiBase]);

  // When session sync is on, the HTTP-only cookie is the source of truth. If another app signs out,
  // the cookie is cleared but this tab may still have a Firebase user in IndexedDB — re-check the API.
  useEffect(() => {
    if (!apiBase) return;

    let lastCheck = 0;
    const debounceMs = 1500;

    const verifyServerSession = async (force: boolean) => {
      const now = Date.now();
      if (!force && now - lastCheck < debounceMs) return;
      lastCheck = now;
      try {
        const r = await fetch(`${apiBase}/session`, { credentials: 'include' });
        if (r.status === 401 && auth.currentUser) {
          await signOut(auth);
        }
      } catch {
        /* offline — do not sign out */
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void verifyServerSession(true);
    };
    const onFocus = () => void verifyServerSession(true);

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    const intervalId = window.setInterval(() => void verifyServerSession(false), 12_000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.clearInterval(intervalId);
    };
  }, [auth, apiBase]);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      await persistServerSession();
    } catch (error) {
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      await persistServerSession();
    } catch (error) {
      console.error('Error signing in with email', error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      await persistServerSession();
    } catch (error) {
      console.error('Error registering with email', error);
      throw error;
    }
  };

  const logout = async () => {
    await clearServerSession();
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
