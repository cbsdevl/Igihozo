import { useState, useEffect, useCallback } from 'react';
import { activityService } from '../../services';
import DataTable from '../../components/DataTable';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

export default function ActivityLogPage() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [moduleFilter, setModuleFilter] = useState('');
  const [modules, setModules] = useState([]);

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20, module: moduleFilter || undefined };
      const res = await activityService.getAll(params);
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [moduleFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    activityService.getModules().then((r) => setModules(r.data.data || [])).catch(() => {});
  }, []);

  if (!isAdmin) return <p className="text-slate-400 text-center py-12">Admin access required</p>;

  const columns = [
    { key: 'created_at', label: 'Time', render: (r) => (
      <span className="text-xs text-slate-400 whitespace-nowrap">{format(new Date(r.created_at), 'MMM d, HH:mm')}</span>
    )},
    { key: 'username', label: 'User', render: (r) => r.username || '—' },
    { key: 'action', label: 'Action', render: (r) => <span className="badge-info">{r.action}</span> },
    { key: 'module', label: 'Module', render: (r) => <span className="badge-gray">{r.module}</span> },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', render: (r) => (
      <span className={r.status === 'success' ? 'badge-success' : 'badge-danger'}>{r.status}</span>
    )},
    { key: 'ip_address', label: 'IP', render: (r) => r.ip_address || '—' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="page-title">Activity Log</h1>
        <p className="page-subtitle">Track all system activities (Admin only)</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="input w-auto">
          <option value="">All Modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetch(p)}
        emptyMessage="No activity logs found"
      />
    </div>
  );
}
