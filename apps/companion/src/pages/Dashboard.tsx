import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, LogOut, StickyNote, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, todoAppUrl } from '../firebase';
import { useAuth } from '@two-do/shared';
import type { QuickNote } from '../types';
import '../App.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'companion_notes'), where('userId', '==', user.uid));

    const unsub = onSnapshot(q, (snap) => {
      const next: QuickNote[] = [];
      snap.forEach((d) => {
        const data = d.data();
        next.push({
          id: d.id,
          text: String(data.text ?? ''),
          createdAt: Number(data.createdAt ?? 0),
        });
      });
      next.sort((a, b) => b.createdAt - a.createdAt);
      setNotes(next);
    });

    return () => unsub();
  }, [user]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !draft.trim()) return;
    try {
      await addDoc(collection(db, 'companion_notes'), {
        userId: user.uid,
        text: draft.trim(),
        createdAt: Date.now(),
      });
      setDraft('');
    } catch (err) {
      console.error(err);
    }
  };

  const removeNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'companion_notes', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="companion-app">
      <div className="companion-inner">
        <motion.header
          className="companion-hero"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h1>two·do companion</h1>
          <p>Same Firebase account as your task app — quick notes and a shortcut home.</p>
        </motion.header>

        <motion.section
          className="companion-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <h2>Account</h2>
          <div className="user-row">
            <div className="user-meta">
              <div>
                <strong>Signed in as</strong> {user?.email ?? user?.uid}
              </div>
              <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', opacity: 0.85 }}>
                UID <code style={{ color: 'var(--accent-ice)' }}>{user?.uid}</code>
              </div>
            </div>
            <div className="link-row">
              <a className="btn btn-primary" href={todoAppUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                Open two·do
              </a>
              <button type="button" className="btn btn-ghost" onClick={() => logout()}>
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="companion-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <h2>
            <StickyNote size={18} style={{ verticalAlign: '-3px', marginRight: '0.35rem' }} />
            Quick notes
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Stored in Firestore under <code>companion_notes</code> (per user). Add a security rule for this collection
            before production.
          </p>
          <form className="note-form" onSubmit={addNote}>
            <input
              className="note-input"
              placeholder="Jot something down…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
              Save
            </button>
          </form>
          {notes.length === 0 ? (
            <div className="empty-notes">No notes yet.</div>
          ) : (
            <ul className="note-list">
              {notes.map((n) => (
                <li key={n.id} className="note-item">
                  <span>{n.text}</span>
                  <button type="button" onClick={() => removeNote(n.id)} aria-label="Delete note">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>
    </div>
  );
}
