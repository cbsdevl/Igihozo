import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const { user } = useAuth();
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPwd || !newPwd || newPwd.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword({ current_password: currentPwd, new_password: newPwd });
      toast.success('Password changed successfully');
      setShowChangePwd(false);
      setCurrentPwd('');
      setNewPwd('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{user.full_name}</h2>
            <span className="badge-info capitalize">{user.role_name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Username</label>
            <p className="text-slate-700 dark:text-slate-200">{user.username}</p>
          </div>
          <div>
            <label className="label">Email</label>
            <p className="text-slate-700 dark:text-slate-200">{user.email || '—'}</p>
          </div>
          <div>
            <label className="label">Phone</label>
            <p className="text-slate-700 dark:text-slate-200">{user.phone || '—'}</p>
          </div>
          <div>
            <label className="label">Member Since</label>
            <p className="text-slate-700 dark:text-slate-200">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={() => setShowChangePwd(!showChangePwd)} className="btn-secondary">
            Change Password
          </button>
        </div>

        {showChangePwd && (
          <form onSubmit={handleChangePassword} className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
            <div className="form-group">
              <label className="label">Current Password</label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="input"
                required
              />
            </div>
            <div className="form-group">
              <label className="label">New Password</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="input"
                placeholder="At least 6 characters"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Changing...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

