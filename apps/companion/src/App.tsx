import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@two-do/shared';
import { auth, googleProvider } from './firebase';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import './App.css';

const sessionSync = import.meta.env.VITE_AUTH_API_URL
  ? { apiBaseUrl: import.meta.env.VITE_AUTH_API_URL }
  : undefined;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider auth={auth} googleProvider={googleProvider} sessionSync={sessionSync}>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
