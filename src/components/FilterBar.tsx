import type { FilterType } from '../types';
import { motion } from 'framer-motion';
import './FilterBar.css';

interface FilterBarProps {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  taskCount: { all: number; active: number; completed: number };
}

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export default function FilterBar({ filter, onFilterChange, taskCount }: FilterBarProps) {
  return (
    <motion.div
      className="filter-bar"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div className="filter-pills">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`filter-pill ${filter === f.key ? 'active' : ''}`}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
            <span className="filter-count">
              {taskCount[f.key]}
            </span>
            {filter === f.key && (
              <motion.div
                className="filter-pill-bg"
                layoutId="filterPill"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
