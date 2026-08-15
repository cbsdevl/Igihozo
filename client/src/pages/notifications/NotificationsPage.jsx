import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { HiBell, HiCheck, HiTrash } from 'react-icons/hi2';
import DataTable from '../../components/DataTable';
import { notificationService } from '../../services';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        unread_only: filter === 'unread' ? 'true' : undefined,
      };
      const res = await notificationService.getAll(params);
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
      setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      fetchNotifications(pagination.page);
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleRemove = async (id) => {
    try {
      await notificationService.remove(id);
      fetchNotifications(pagination.page);
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      fetchNotifications(1);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const handleClearRead = async () => {
    try {
      await notificationService.clearRead();
      fetchNotifications(1);
    } catch (err) {
      console.error('Failed to clear read notifications', err);
    }
  };

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={row.is_read ? 'badge-gray' : 'badge-info'}>
          {row.is_read ? 'Read' : 'Unread'}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Notification',
      render: (row) => (
        <div className="space-y-1">
          <div className="font-semibold text-slate-800">{row.title || 'Notification'}</div>
          <div className="text-sm text-slate-500">{row.message || 'No details available'}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => <span className="badge-gray">{row.type || 'info'}</span>,
    },
    {
      key: 'created_at',
      label: 'Received',
      render: (row) => (
        <span className="text-sm text-slate-400 whitespace-nowrap">
          {format(new Date(row.created_at), 'MMM d, HH:mm')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {!row.is_read && (
            <button className="btn btn-secondary btn-sm" onClick={() => handleMarkRead(row.id)}>
              <HiCheck className="w-4 h-4" />
              Mark read
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => handleRemove(row.id)}>
            <HiTrash className="w-4 h-4" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">View alerts, stock updates, and system messages for admins and workers.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-auto">
            <option value="all">All notifications</option>
            <option value="unread">Unread only</option>
          </select>
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            <HiCheck className="w-4 h-4" />
            Mark all read
          </button>
          <button className="btn btn-danger" onClick={handleClearRead}>
            <HiTrash className="w-4 h-4" />
            Clear read
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
            <HiBell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-800">{pagination.total}</p>
          </div>
        </div>

        <div className="card flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-warning-100 text-warning-600 flex items-center justify-center">
            <HiBell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Unread</p>
            <p className="text-2xl font-bold text-slate-800">{unreadCount}</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={notifications}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchNotifications(page)}
        emptyMessage="No notifications found"
      />
    </div>
  );
}
