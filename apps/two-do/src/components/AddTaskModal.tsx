import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Flag } from 'lucide-react';
import type { Priority } from '../types';
import './AddTaskModal.css';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: { title: string; description: string; priority: Priority; category: string }) => void;
}

const priorities: { key: Priority; label: string; color: string }[] = [
  { key: 'low', label: 'Low', color: 'var(--accent-sage)' },
  { key: 'medium', label: 'Medium', color: 'var(--accent-gold)' },
  { key: 'high', label: 'High', color: 'var(--accent-red)' },
];

export default function AddTaskModal({ isOpen, onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('low');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), description: description.trim(), priority, category: category.trim() });
    setTitle('');
    setDescription('');
    setPriority('low');
    setCategory('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-panel"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">New Task</h2>
              <button type="button" className="modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Add some details... (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <div className="priority-pills">
                  {priorities.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className={`priority-pill ${priority === p.key ? 'active' : ''}`}
                      onClick={() => setPriority(p.key)}
                      style={{ '--pill-color': p.color } as React.CSSProperties}
                    >
                      <Flag size={12} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Work, Personal, Health..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <button type="submit" className="form-submit" disabled={!title.trim()}>
                <Plus size={18} />
                Add Task
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
