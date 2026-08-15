import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HiHome,
  HiBeaker,
  HiShoppingCart,
  HiUsers,
  HiTruck,
  HiIdentification,
  HiDocumentChartBar,
  HiBell,
  HiCog6Tooth,
  HiClock,
} from 'react-icons/hi2';

const links = [
  { to: '/', label: 'Dashboard', icon: HiHome, adminOnly: false },
  { to: '/medicines', label: 'Medicines', icon: HiBeaker, adminOnly: false },
  { to: '/sales/new', label: 'New Sale', icon: HiShoppingCart, adminOnly: false },
  { to: '/sales', label: 'Sales', icon: HiDocumentChartBar, adminOnly: false },
  { to: '/workers', label: 'Workers', icon: HiUsers, adminOnly: true },
  { to: '/suppliers', label: 'Suppliers', icon: HiTruck, adminOnly: false },
  { to: '/customers', label: 'Customers', icon: HiIdentification, adminOnly: false },
  { to: '/reports', label: 'Reports', icon: HiDocumentChartBar, adminOnly: false },
  { to: '/notifications', label: 'Notifications', icon: HiBell, adminOnly: false },
  { to: '/settings', label: 'Settings', icon: HiCog6Tooth, adminOnly: true },
  { to: '/activity', label: 'Activity Log', icon: HiClock, adminOnly: true },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { isAdmin } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 flex flex-col transition-transform duration-300 ${
          collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 dark:border-slate-700">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg">
            G
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">Gihozo</h1>
            <p className="text-xs text-slate-400">Pharmacy Management</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {links
            .filter((l) => !l.adminOnly || isAdmin)
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-400 text-center">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}

