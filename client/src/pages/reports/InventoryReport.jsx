import { useState, useEffect } from 'react';
import { reportService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function InventoryReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.inventory()
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-8" />;
  if (!data) return <p className="text-slate-400 text-center py-8">No data</p>;

  const summary = data.summary || {};
  const medicines = data.medicines || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="stat-label">Total Items</p>
          <p className="stat-value">{summary.total || 0}</p>
        </div>
        <div className="card">
          <p className="stat-label">Total Units</p>
          <p className="stat-value">{summary.total_units || 0}</p>
        </div>
        <div className="card">
          <p className="stat-label">Total Value</p>
          <p className="stat-value">{(summary.total_value || 0).toLocaleString()} RWF</p>
        </div>
      </div>

      <div className="card">
        <h4 className="font-semibold mb-3">Full Inventory</h4>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Purchase Price</th>
                <th className="text-right">Selling Price</th>
                <th className="text-right">Stock Value</th>
                <th>Supplier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {medicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-slate-400 py-8">No medicines found</td>
                </tr>
              ) : (
                medicines.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium">{m.name}</td>
                    <td>{m.category_name || '-'}</td>
                    <td className="text-right">{m.quantity}</td>
                    <td className="text-right">{(m.purchase_price || 0).toLocaleString()}</td>
                    <td className="text-right">{(m.selling_price || 0).toLocaleString()}</td>
                    <td className="text-right">{(m.quantity * m.purchase_price || 0).toLocaleString()} RWF</td>
                    <td>{m.supplier_name || '-'}</td>
                    <td><span className={m.status === 'active' ? 'badge-success' : 'badge-gray'}>{m.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
