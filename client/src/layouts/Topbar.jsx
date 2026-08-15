import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HiBars3,
  HiBell,
  HiArrowRightOnRectangle,
  HiUser,
  HiMoon,
  HiSun,
} from 'react-icons/hi2';
import { notificationService } from '../services';
import { format } from 'date-fns';

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === 'true');
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const notifRef = useRef();
  const userRef = useRef();

  // Load notifications
  useEffect(() => {
    notificationService.getAll({ limit: 5 }).then((res) => {
      setNotifications(res.data.data || []);
    }).catch(() => {});
  }, []);

  // Toggle dark mode
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('dark', next);
    document.documentElement.classList.toggle('dark', next);
  };

  // Click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="btn-icon lg:hidden">
          <HiBars3 className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">
          {user?.full_name ? `Welcome, ${user.full_name.split(' ')[0]}` : 'Dashboard'}
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Dark mode */}
        <button onClick={toggleDark} className="btn-icon">
          {dark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="btn-icon relative"
          >
            <HiBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in">
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <Link
                  to="/notifications"
                  onClick={() => setShowNotif(false)}
                  className="text-xs text-primary-600 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-400 p-4 text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer ${
                        !n.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {format(new Date(n.created_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setShowUser(!showUser)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
              {user?.full_name || 'User'}
            </span>
          </button>

          {showUser && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in">
              <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.full_name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role_name}</p>
              </div>
              <div className="p-1">
                <Link
                  to="/profile"
                  onClick={() => setShowUser(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <HiUser className="w-4 h-4" />
                  Profile
                </Link>
                <button
                  onClick={() => { setShowUser(false); logout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                >
                  <HiArrowRightOnRectangle className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

