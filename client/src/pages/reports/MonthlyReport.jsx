import { useState } from 'react';
import { reportService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MonthlyReport() {
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await reportService.monthly(month);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-auto" />
        <button onClick={fetch} className="btn-primary">Load</button>
      </div>

      {loading ? <LoadingSpinner className="py-8" /> : !data ? (
        <p className="text-slate-400 text-center py-8">Select a month and load</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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

          {data.workerPerformance?.length > 0 && (
            <div className="card">
              <h4 className="font-semibold mb-3">Worker Performance</h4>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Worker</th><th className="text-right">Sales</th><th className="text-right">Revenue</th></tr></thead>
                  <tbody>
                    {data.workerPerformance.map((w, i) => (
                      <tr key={i}><td>{w.full_name}</td><td className="text-right">{w.sales}</td><td className="text-right">{(w.revenue || 0).toLocaleString()} RWF</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.topMedicines?.length > 0 && (
            <div className="card">
              <h4 className="font-semibold mb-3">Top Medicines</h4>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Medicine</th><th className="text-right">Qty</th><th className="text-right">Revenue</th></tr></thead>
                  <tbody>
                    {data.topMedicines.map((m, i) => (
                      <tr key={i}><td>{m.medicine_name}</td><td className="text-right">{m.qty}</td><td className="text-right">{(m.revenue || 0).toLocaleString()} RWF</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

