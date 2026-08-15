import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  HiCurrencyDollar,
  HiShoppingCart,
  HiBeaker,
  HiExclamationTriangle,
  HiClock,
  HiUserGroup,
  HiChartBar,
  HiArrowTrendingUp,
} from 'react-icons/hi2';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.dashboard()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" className="min-h-[60vh]" />;
  }

  const { kpi, charts, recentSales, recentActivity } = data || {};
  const k = kpi || {};
  const ts = k.todaySales || {};
  const ws = k.weeklySales || {};
  const ms = k.monthlySales || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of pharmacy operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={`${ts.revenue?.toLocaleString() || 0} RWF`}
          icon={HiCurrencyDollar}
          color="primary"
          subtitle={`${ts.count || 0} transactions`}
        />
        <StatCard
          title="Weekly Revenue"
          value={`${ws.revenue?.toLocaleString() || 0} RWF`}
          icon={HiChartBar}
          color="success"
          subtitle={`${ws.count || 0} transactions`}
        />
        <StatCard
          title="Monthly Revenue"
          value={`${ms.revenue?.toLocaleString() || 0} RWF`}
          icon={HiArrowTrendingUp}
          color="info"
          subtitle={`${ms.count || 0} transactions`}
        />
        <StatCard
          title="Today's Profit"
          value={`${(k.todayProfit?.profit || 0).toLocaleString()} RWF`}
          icon={HiCurrencyDollar}
          color="warning"
        />
        <StatCard
          title="Monthly Profit"
          value={`${(k.monthlyProfit?.profit || 0).toLocaleString()} RWF`}
          icon={HiArrowTrendingUp}
          color="success"
        />
        <StatCard
          title="Low Stock Items"
          value={k.lowStock?.count || 0}
          icon={HiExclamationTriangle}
          color="danger"
          subtitle="Needs reorder"
        />
        <StatCard
          title="Near Expiry"
          value={k.nearExpiry?.count || 0}
          icon={HiClock}
          color="warning"
          subtitle="Within 30 days"
        />
        <StatCard
          title="Medicines"
          value={k.totalMedicines?.count || 0}
          icon={HiBeaker}
          color="primary"
          subtitle={`${k.expired?.count || 0} expired`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Month */}
        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Sales Trend (12 Months)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.salesByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Medicines */}
        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Top Medicines (30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.topMedicines || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="medicine_name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="#22c55e" radius={[0, 4, 4, 0]} name="Quantity Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit by Month */}
        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Profit Trend (12 Months)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.profitByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Category Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.categoryStats || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(charts?.categoryStats || []).map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Recent Sales</h3>
            <Link to="/sales" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Worker</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {(!recentSales || recentSales.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 py-8">No recent sales</td>
                  </tr>
                ) : (
                  recentSales.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono text-xs">{s.invoice_number}</td>
                      <td>{s.customer_name || 'Walk-in'}</td>
                      <td className="font-medium">{s.total?.toLocaleString()} RWF</td>
                      <td>{s.worker_name}</td>
                      <td className="text-xs text-slate-400">{format(new Date(s.created_at), 'HH:mm')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Recent Activity</h3>
            <Link to="/activity" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(!recentActivity || recentActivity.length === 0) ? (
              <p className="text-slate-400 text-sm text-center py-8">No recent activity</p>
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    a.status === 'failed' ? 'bg-danger-500' : 'bg-accent-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{a.description}</p>
                    <p className="text-xs text-slate-400">
                      {a.username} · {format(new Date(a.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

