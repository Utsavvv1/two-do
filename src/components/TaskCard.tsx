import { motion } from 'framer-motion';
import { Check, Trash2, Flag } from 'lucide-react';
import type { Task } from '../types';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

const priorityConfig = {
  low: { color: 'var(--accent-sage)', label: 'Low' },
  medium: { color: 'var(--accent-gold)', label: 'Medium' },
  high: { color: 'var(--accent-red)', label: 'High' },
};

export default function TaskCard({ task, onToggle, onDelete, index }: TaskCardProps) {
  const priority = priorityConfig[task.priority];

  return (
    <motion.div
      className={`task-card ${task.completed ? 'completed' : ''}`}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(4px)' }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{ '--priority-color': priority.color } as React.CSSProperties}
    >
      <div className="task-priority-bar" />

      <button
        className={`task-check ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check size={14} strokeWidth={3} />
          </motion.div>
        )}
      </button>

      <div className="task-content">
        <h3 className="task-title">{task.title}</h3>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        <div className="task-meta">
          <span className="task-priority-badge" style={{ color: priority.color }}>
            <Flag size={11} />
            {priority.label}
          </span>
          {task.category && (
            <span className="task-category">{task.category}</span>
          )}
        </div>
      </div>

      <button
        className="task-delete"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
      >
        <Trash2 size={15} />
      </button>
    </motion.div>
  );
}
