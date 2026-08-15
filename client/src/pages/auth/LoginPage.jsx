import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-lg shadow-primary-200 dark:shadow-primary-900/30">
            G
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gihozo Pharmacy</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Management System</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card p-6 border border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-5">Sign In</h2>

          {error && (
            <div className="p-3 mb-4 bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Enter username"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6">
          Gihozo Pharmacy Management System v1.0
        </p>
      </div>
    </div>
  );
}

