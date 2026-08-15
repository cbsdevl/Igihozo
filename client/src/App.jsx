import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import ProfilePage from './pages/auth/ProfilePage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MedicinesPage from './pages/medicines/MedicinesPage';
import CategoriesPage from './pages/medicines/CategoriesPage';
import NewSalePage from './pages/sales/NewSalePage';
import SalesHistoryPage from './pages/sales/SalesHistoryPage';
import SaleDetailPage from './pages/sales/SaleDetailPage';
import SalesStatsPage from './pages/sales/SalesStatsPage';
import WorkersPage from './pages/workers/WorkersPage';
import SuppliersPage from './pages/suppliers/SuppliersPage';
import CustomersPage from './pages/customers/CustomersPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import ActivityLogPage from './pages/activity/ActivityLogPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="medicines" element={<MedicinesPage />} />
            <Route path="medicines/categories" element={<CategoriesPage />} />
            <Route path="sales/new" element={<NewSalePage />} />
            <Route path="sales" element={<SalesHistoryPage />} />
            <Route path="sales/stats" element={<SalesStatsPage />} />
            <Route path="sales/:id" element={<SaleDetailPage />} />
            <Route
              path="workers"
              element={
                <ProtectedRoute requireAdmin>
                  <WorkersPage />
                </ProtectedRoute>
              }
            />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route
              path="settings"
              element={
                <ProtectedRoute requireAdmin>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="activity"
              element={
                <ProtectedRoute requireAdmin>
                  <ActivityLogPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );

}
