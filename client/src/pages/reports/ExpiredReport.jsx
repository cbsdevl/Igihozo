import { useState, useEffect } from 'react';
import { reportService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';

export default function ExpiredReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.expired().then((r) => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-8" />;
  if (!data) return <p className="text-slate-400 text-center py-8">No data</p>;

  const sections = [
    { label: 'Expired', items: data.expired, color: 'text-danger-600' },
    { label: 'Expiring in 30 days', items: data.near30, color: 'text-warning-600' },
    { label: 'Expiring in 60 days', items: data.near60, color: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <p className="stat-label">Estimated Loss on Expired Stock</p>
        <p className="stat-value text-danger-600">{(data.expiredLoss || 0).toLocaleString()} RWF</p>
      </div>

      {sections.map((section) => (
        <div key={section.label} className="card">
          <h4 className={`font-semibold mb-3 ${section.color}`}>{section.label} ({section.items?.length || 0})</h4>
          {!section.items || section.items.length === 0 ? (
            <p className="text-slate-400 text-sm">None</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Name</th><th>Batch</th><th>Qty</th><th>Expiry</th><th>Supplier</th></tr></thead>
                <tbody>
                  {section.items.map((m) => (
                    <tr key={m.id}>
                      <td className="font-medium">{m.name}</td>
                      <td>{m.batch_number || '—'}</td>
                      <td>{m.quantity}</td>
                      <td className={new Date(m.expiry_date) < new Date() ? 'text-danger-600 font-medium' : ''}>
                        {format(new Date(m.expiry_date), 'MMM d, yyyy')}
                      </td>
                      <td>{m.supplier_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

