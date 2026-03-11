import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { Plus, LogOut } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Task, FilterType, Priority } from '../types';
import Header from '../components/Header';
import FilterBar from '../components/FilterBar';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import EmptyState from '../components/EmptyState';
import '../App.css';

export default function Home() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch tasks from Firestore
  useEffect(() => {
    if (!user) return;
    
    // Create query to only fetch tasks belonging to current user
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbTasks: Task[] = [];
      snapshot.forEach((doc) => {
        dbTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(dbTasks);
    });

    return () => unsubscribe();
  }, [user]);

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
  const addTask = async (data: { title: string; description: string; priority: Priority; category: string }) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "tasks"), {
        ...data,
        userId: user.uid,
        completed: false,
        createdAt: Date.now(),
      });
    } catch (error) {
       console.error("Error adding document: ", error);
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
        const taskRef = doc(db, "tasks", id);
        await updateDoc(taskRef, {
            completed: !task.completed
        });
    } catch (error) {
        console.error("Error updating document: ", error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
        await deleteDoc(doc(db, "tasks", id));
    } catch (error) {
        console.error("Error deleting document: ", error);
    }
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
        
        {/* User Info & Logout Header */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem', gap: '1rem' }}>
           <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
             {user?.email}
           </span>
           <button 
             onClick={logout} 
             style={{
               background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', 
               color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
               display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
             }}
             onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
             onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
             <LogOut size={16} /> Logout
           </button>
        </div>

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
