import { motion } from 'framer-motion';
import { CheckCircle2, ListTodo, Clock } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  total: number;
  completed: number;
  active: number;
}

export default function Header({ total, completed, active }: HeaderProps) {
  return (
    <motion.header
      className="header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="header-left">
        <h1 className="header-title">two·do</h1>
        <p className="header-subtitle">your calm space for getting things done</p>
      </div>
      <div className="header-stats">
        <div className="stat">
          <ListTodo size={16} />
          <span className="stat-value">{total}</span>
          <span className="stat-label">total</span>
        </div>
        <div className="stat">
          <Clock size={16} />
          <span className="stat-value">{active}</span>
          <span className="stat-label">active</span>
        </div>
        <div className="stat stat-completed">
          <CheckCircle2 size={16} />
          <span className="stat-value">{completed}</span>
          <span className="stat-label">done</span>
        </div>
      </div>
    </motion.header>
  );
}
