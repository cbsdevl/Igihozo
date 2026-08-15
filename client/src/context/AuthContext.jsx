import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services';
import { toast } from 'react-toastify';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authService.profile();
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (username, password) => {
    const res = await authService.login({ username, password });
    const { user: userData, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Logged out');
  };

  const isAdmin = user?.role_name === 'admin';
  const isWorker = user?.role_name === 'worker';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loadUser, isAdmin, isWorker }}>
      {children}
    </AuthContext.Provider>
  );
}

