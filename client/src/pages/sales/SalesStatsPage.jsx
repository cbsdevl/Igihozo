import { useState, useEffect } from 'react';
import { saleService } from '../../services';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import { HiArrowLeft, HiCurrencyDollar, HiShoppingCart, HiChartBar } from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalesStatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saleService.getStats()
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;
  if (!stats) return <p className="text-slate-400 text-center py-12">No stats available</p>;

  const { today, week, month, salesByMonth, topMedicines } = stats;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/sales" className="btn-icon">
          <HiArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Sales Statistics</h1>
          <p className="page-subtitle">Overview of sales performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Today" value={`${today?.revenue?.toLocaleString() || 0} RWF`} icon={HiCurrencyDollar} color="primary" subtitle={`${today?.count || 0} sales`} />
        <StatCard title="This Week" value={`${week?.revenue?.toLocaleString() || 0} RWF`} icon={HiChartBar} color="success" subtitle={`${week?.count || 0} sales`} />
        <StatCard title="This Month" value={`${month?.revenue?.toLocaleString() || 0} RWF`} icon={HiShoppingCart} color="info" subtitle={`${month?.count || 0} sales`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-base font-semibold mb-4">Sales by Month</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-base font-semibold mb-4">Top Medicines (30 Days)</h3>
          <div className="space-y-2">
            {(!topMedicines || topMedicines.length === 0) ? (
              <p className="text-slate-400 text-sm">No data</p>
            ) : (
              topMedicines.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{m.medicine_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{m.total_qty} sold</p>
                    <p className="text-xs text-slate-400">{m.total_revenue?.toLocaleString()} RWF</p>
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

