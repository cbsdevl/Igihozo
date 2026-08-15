import { useState, useEffect } from 'react';
import { reportService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProfitReport() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.profit({ period: 'monthly' }).then((r) => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-8" />;
  if (!isAdmin) return <p className="text-slate-400 text-center">Admin access required</p>;
  if (!data) return <p className="text-slate-400 text-center py-8">No data</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card"><p className="stat-label">Today Profit</p><p className="stat-value text-accent-600">{(data.today?.profit || 0).toLocaleString()} RWF</p><p className="text-xs text-slate-400">Revenue: {(data.today?.revenue || 0).toLocaleString()} RWF</p></div>
        <div className="card"><p className="stat-label">Week Profit</p><p className="stat-value text-accent-600">{(data.week?.profit || 0).toLocaleString()} RWF</p></div>
        <div className="card"><p className="stat-label">Month Profit</p><p className="stat-value text-accent-600">{(data.month?.profit || 0).toLocaleString()} RWF</p></div>
        <div className="card"><p className="stat-label">Year Profit</p><p className="stat-value text-accent-600">{(data.year?.profit || 0).toLocaleString()} RWF</p></div>
      </div>

      {data.trend?.length > 0 && (
        <div className="card">
          <h4 className="font-semibold mb-3">Profit Trend (12 Months)</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} name="Profit" />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

