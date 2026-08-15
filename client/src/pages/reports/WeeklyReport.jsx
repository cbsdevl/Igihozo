import { useState, useEffect } from 'react';
import { reportService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.weekly().then((r) => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-8" />;
  if (!data) return <p className="text-slate-400 text-center py-8">No data available</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card"><p className="stat-label">Transactions</p><p className="stat-value">{data.summary?.transactions || 0}</p></div>
        <div className="card"><p className="stat-label">Revenue</p><p className="stat-value">{(data.summary?.revenue || 0).toLocaleString()} RWF</p></div>
        <div className="card"><p className="stat-label">Profit</p><p className="stat-value text-accent-600">{(data.summary?.profit || 0).toLocaleString()} RWF</p></div>
      </div>

      {data.dailyBreakdown?.length > 0 && (
        <div className="card">
          <h4 className="font-semibold mb-3">Daily Breakdown</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.topMedicines?.length > 0 && (
        <div className="card">
          <h4 className="font-semibold mb-3">Top Medicines</h4>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Medicine</th><th className="text-right">Qty Sold</th><th className="text-right">Revenue</th></tr></thead>
              <tbody>
                {data.topMedicines.map((m, i) => (
                  <tr key={i}>
                    <td>{m.medicine_name}</td>
                    <td className="text-right">{m.qty}</td>
                    <td className="text-right">{(m.revenue || 0).toLocaleString()} RWF</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

