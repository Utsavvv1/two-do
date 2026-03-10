import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Task, FilterType, Priority } from './types';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import TaskCard from './components/TaskCard';
import AddTaskModal from './components/AddTaskModal';
import EmptyState from './components/EmptyState';
import './App.css';

const STORAGE_KEY = 'two-do-tasks';

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Computed values
  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  const activeCount = tasks.length - completedCount;

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (filter === 'active') filtered = tasks.filter((t) => !t.completed);
    if (filter === 'completed') filtered = tasks.filter((t) => t.completed);
    // Sort: uncompleted first, then by createdAt desc
    return [...filtered].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  }, [tasks, filter]);

  const taskCount = useMemo(
    () => ({
      all: tasks.length,
      active: activeCount,
      completed: completedCount,
    }),
    [tasks.length, activeCount, completedCount]
  );

  // Actions
  const addTask = (data: { title: string; description: string; priority: Priority; category: string }) => {
    const newTask: Task = {
      id: uuidv4(),
      ...data,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="app">
      {/* Background image */}
      <div className="app-bg" />
      <div className="app-bg-overlay" />

      {/* Ambient particles */}
      <div className="particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              opacity: 0.15 + Math.random() * 0.2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="app-container">
        <Header total={tasks.length} completed={completedCount} active={activeCount} />
        <FilterBar filter={filter} onFilterChange={setFilter} taskCount={taskCount} />

        <LayoutGroup>
          <div className="task-list">
            <AnimatePresence mode="popLayout">
              {filteredTasks.length === 0 ? (
                <EmptyState key="empty" />
              ) : (
                filteredTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    index={index}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </LayoutGroup>

        {/* FAB */}
        <button
          className="fab"
          onClick={() => setIsModalOpen(true)}
          aria-label="Add new task"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Modal */}
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} />
    </div>
  );
}
