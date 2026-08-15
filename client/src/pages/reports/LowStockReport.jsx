import { useState, useEffect } from 'react';
import { reportService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function LowStockReport() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.lowStock().then((r) => { setData(r.data.data || []); setTotal(r.data.total || 0); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-8" />;

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="stat-label">Low Stock Items</p>
        <p className="stat-value text-danger-600">{total}</p>
      </div>

      {data.length === 0 ? (
        <p className="text-slate-400 text-center py-8 text-accent-600 font-medium">No low stock items</p>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Category</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Min Stock</th>
                  <th>Supplier</th>
                  <th>Supplier Phone</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => {
                  const ratio = m.min_stock > 0 ? m.quantity / m.min_stock : 0;
                  return (
                    <tr key={m.id}>
                      <td className="font-medium">{m.name}</td>
                      <td>{m.category_name || '—'}</td>
                      <td className={`text-right font-bold ${ratio <= 0.5 ? 'text-danger-600' : 'text-warning-600'}`}>{m.quantity}</td>
                      <td className="text-right">{m.min_stock}</td>
                      <td>{m.supplier_name || '—'}</td>
                      <td>{m.supplier_phone || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

