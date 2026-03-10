import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import './EmptyState.css';

export default function EmptyState() {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <motion.div
        className="empty-icon"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Leaf size={40} />
      </motion.div>
      <h3 className="empty-title">A calm start</h3>
      <p className="empty-description">
        No tasks yet. Add one to begin your journey.
      </p>
    </motion.div>
  );
}
