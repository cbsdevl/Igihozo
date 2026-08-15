import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { saleService } from '../../services';
import DataTable from '../../components/DataTable';
import { useAuth } from '../../hooks/useAuth';
import { HiPlus } from 'react-icons/hi2';
import { format } from 'date-fns';

export default function SalesHistoryPage() {
  const { isAdmin } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        search: search || undefined,
        payment_method: paymentFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };
      if (isAdmin && workerFilter) params.worker_id = workerFilter;
      const res = await saleService.getAll(params);
      setSales(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, workerFilter, paymentFilter, dateFrom, dateTo, isAdmin]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    { key: 'invoice_number', label: 'Invoice', render: (r) => (
      <Link to={`/sales/${r.id}`} className="font-mono text-xs text-primary-600 hover:underline">{r.invoice_number}</Link>
    )},
    { key: 'customer_name', label: 'Customer', render: (r) => r.customer_name || 'Walk-in' },
    { key: 'total', label: 'Total', render: (r) => `${r.total?.toLocaleString()} RWF` },
    { key: 'payment_method', label: 'Payment', render: (r) => (
      <span className="capitalize">{r.payment_method?.replace('_', ' ')}</span>
    )},
    { key: 'worker_name', label: 'Worker' },
    { key: 'status', label: 'Status', render: (r) => {
      const cls = r.status === 'completed' ? 'badge-success' : r.status === 'cancelled' ? 'badge-danger' : 'badge-warning';
      return <span className={cls}>{r.status}</span>;
    }},
    { key: 'created_at', label: 'Date', render: (r) => (
      <span className="text-xs text-slate-400">{format(new Date(r.created_at), 'MMM d, HH:mm')}</span>
    )},
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="page-subtitle">View and manage all sales</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/sales/stats" className="btn-ghost">Stats</Link>
          <Link to="/sales/new" className="btn-primary">
            <HiPlus className="w-4 h-4" /> New Sale
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-auto" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-auto" />
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="input w-auto">
          <option value="">All Payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="mobile_money">Mobile Money</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={sales}
        loading={loading}
        searchable
        onSearch={setSearch}
        placeholder="Search by invoice or customer..."
        pagination={pagination}
        onPageChange={(p) => fetch(p)}
      />
    </div>
  );
}

