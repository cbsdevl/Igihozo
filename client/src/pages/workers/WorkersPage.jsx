import { useState, useEffect, useCallback } from 'react';
import { workerService } from '../../services';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import WorkerForm from './WorkerForm';
import { toast } from 'react-toastify';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi2';

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20, search: search || undefined };
      const res = await workerService.getAll(params);
      setWorkers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await workerService.remove(deleteId);
      toast.success('Worker removed');
      setDeleteId(null);
      fetch(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'full_name', label: 'Name', render: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-xs font-bold">
          {r.full_name?.charAt(0) || 'U'}
        </div>
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{r.full_name}</p>
          <p className="text-xs text-slate-400">@{r.username}</p>
        </div>
      </div>
    )},
    { key: 'email', label: 'Email', render: (r) => r.email || '—' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    { key: 'is_active', label: 'Status', render: (r) => (
      <span className={r.is_active ? 'badge-success' : 'badge-danger'}>
        {r.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'last_login', label: 'Last Login', render: (r) =>
      r.last_login ? new Date(r.last_login).toLocaleDateString() : 'Never'
    },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setEditItem(r); setFormOpen(true); }} className="btn-icon" title="Edit">
          <HiPencil className="w-4 h-4" />
        </button>
        <button onClick={() => setDeleteId(r.id)} className="btn-icon text-danger-500" title="Remove">
          <HiTrash className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Workers</h1>
          <p className="page-subtitle">Manage pharmacy staff (Admin only)</p>
        </div>
        <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="btn-primary">
          <HiPlus className="w-4 h-4" /> Add Worker
        </button>
      </div>

      <DataTable
        columns={columns}
        data={workers}
        loading={loading}
        searchable
        onSearch={setSearch}
        placeholder="Search workers..."
        pagination={pagination}
        onPageChange={(p) => fetch(p)}
      />

      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} title={editItem ? 'Edit Worker' : 'Add Worker'} size="md">
        <WorkerForm
          editItem={editItem}
          onSuccess={() => { setFormOpen(false); setEditItem(null); fetch(pagination.page); }}
          onCancel={() => { setFormOpen(false); setEditItem(null); }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Worker"
        message="Are you sure you want to remove this worker?"
        loading={deleting}
      />
    </div>
  );
}

