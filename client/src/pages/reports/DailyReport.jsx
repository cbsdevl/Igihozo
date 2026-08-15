import { useState } from 'react';
import { reportService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { HiDocumentArrowDown } from 'react-icons/hi2';

export default function DailyReport() {
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    if (!date) return;
    setLoading(true);
    try {
      const res = await reportService.daily(date);
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
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-auto" />
        <button onClick={fetch} className="btn-primary">Load Report</button>
      </div>

      {loading ? <LoadingSpinner className="py-8" /> : !data ? (
        <p className="text-slate-400 text-center py-8">Select a date and load the report</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card"><p className="stat-label">Transactions</p><p className="stat-value">{data.summary?.total_transactions || 0}</p></div>
            <div className="card"><p className="stat-label">Revenue</p><p className="stat-value">{(data.summary?.revenue || 0).toLocaleString()} RWF</p></div>
            <div className="card"><p className="stat-label">Profit</p><p className="stat-value text-accent-600">{(data.summary?.profit || 0).toLocaleString()} RWF</p></div>
            <div className="card"><p className="stat-label">Discounts</p><p className="stat-value">{(data.summary?.total_discounts || 0).toLocaleString()} RWF</p></div>
          </div>

          {data.workerPerformance?.length > 0 && (
            <div className="card">
              <h4 className="font-semibold mb-3">Worker Performance</h4>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Worker</th><th className="text-right">Sales</th><th className="text-right">Revenue</th></tr></thead>
                  <tbody>
                    {data.workerPerformance.map((w, i) => (
                      <tr key={i}>
                        <td>{w.full_name}</td>
                        <td className="text-right">{w.sales}</td>
                        <td className="text-right">{(w.revenue || 0).toLocaleString()} RWF</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.topItems?.length > 0 && (
            <div className="card">
              <h4 className="font-semibold mb-3">Top Items</h4>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Item</th><th className="text-right">Qty</th><th className="text-right">Revenue</th></tr></thead>
                  <tbody>
                    {data.topItems.map((item, i) => (
                      <tr key={i}>
                        <td>{item.medicine_name}</td>
                        <td className="text-right">{item.qty}</td>
                        <td className="text-right">{(item.revenue || 0).toLocaleString()} RWF</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.sales?.length > 0 && (
            <div className="card">
              <h4 className="font-semibold mb-3">Sales List</h4>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Invoice</th><th>Customer</th><th className="text-right">Total</th><th>Method</th><th>Worker</th></tr></thead>
                  <tbody>
                    {data.sales.map((s) => (
                      <tr key={s.id}>
                        <td className="font-mono text-xs">{s.invoice_number}</td>
                        <td>{s.customer_name || 'Walk-in'}</td>
                        <td className="text-right">{(s.total || 0).toLocaleString()} RWF</td>
                        <td className="capitalize">{s.payment_method?.replace('_', ' ')}</td>
                        <td>{s.worker_name}</td>
                      </tr>
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

