import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);
  
  // Email/Password state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      setError(null);
      setIsConfigError(false);
      if (isLoginMode) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-api-key' || err.message?.includes('API_KEY')) {
         setIsConfigError(true);
      } else {
         setError(err.message || `Failed to ${isLoginMode ? 'login' : 'register'} with email.`);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsConfigError(false);
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-api-key' || err.message?.includes('API_KEY')) {
         setIsConfigError(true);
      } else {
         setError(err.message || 'Failed to login with Google.');
      }
    }
  };

  return (
    <div className="login-container">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="login-header">
          <div className="login-icon">
            <CheckSquare size={32} />
          </div>
          <h1>Two-Do</h1>
          <p>{isLoginMode ? 'Sign in' : 'Create an account'} to sync your tasks across all devices.</p>
        </div>

        {isConfigError && (
          <div className="config-warning">
            <h3>Firebase Needs Configuration</h3>
            <p>To use Google Sign-In, you must configure Firebase first:</p>
            <ol>
              <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{color: '#fff'}}>Firebase Console</a></li>
              <li>Create a new Project & add a Web App</li>
              <li>Enable "Google" under Authentication Sign-in methods</li>
              <li>Copy the configuration object</li>
              <li>Open <code>src/firebase.ts</code> and paste it there!</li>
            </ol>
          </div>
        )}

        {error && !isConfigError && (
          <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="email-auth-form">
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
          <button type="submit" className="login-button primary-btn">
            {isLoginMode ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button className="login-button" onClick={handleGoogleLogin} type="button">
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google logo" 
            className="google-icon"
          />
          Continue with Google
        </button>

        <p className="auth-mode-toggle">
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            className="text-btn" 
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError(null);
            }}
          >
            {isLoginMode ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
