import { useState, useEffect, useCallback } from 'react';
import { customerService } from '../../services';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';
import { HiPlus, HiPencil } from 'react-icons/hi2';

function CustomerForm({ editItem, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        phone: editItem.phone || '',
        email: editItem.email || '',
        address: editItem.address || '',
        notes: editItem.notes || '',
      });
    }
  }, [editItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Customer name is required'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await customerService.update(editItem.id, form);
        toast.success('Customer updated');
      } else {
        await customerService.create(form);
        toast.success('Customer created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const update = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group sm:col-span-2">
          <label className="label">Name *</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} className="input" required />
        </div>
        <div className="form-group">
          <label className="label">Phone</label>
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input" />
        </div>
        <div className="form-group sm:col-span-2">
          <label className="label">Address</label>
          <input value={form.address} onChange={(e) => update('address', e.target.value)} className="input" />
        </div>
        <div className="form-group sm:col-span-2">
          <label className="label">Notes</label>
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="input" rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20, search: search || undefined };
      const res = await customerService.getAll(params);
      setCustomers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    { key: 'name', label: 'Name', render: (r) => (
      <span className="font-medium text-slate-800 dark:text-slate-100">{r.name}</span>
    )},
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    { key: 'email', label: 'Email', render: (r) => r.email || '—' },
    { key: 'address', label: 'Address', render: (r) => r.address || '—' },
    { key: 'created_at', label: 'Since', render: (r) => new Date(r.created_at).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (r) => (
      <button onClick={() => { setEditItem(r); setFormOpen(true); }} className="btn-icon">
        <HiPencil className="w-4 h-4" />
      </button>
    )},
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage pharmacy customers</p>
        </div>
        <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="btn-primary">
          <HiPlus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchable
        onSearch={setSearch}
        placeholder="Search customers..."
        pagination={pagination}
        onPageChange={(p) => fetch(p)}
      />

      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} title={editItem ? 'Edit Customer' : 'Add Customer'} size="md">
        <CustomerForm
          editItem={editItem}
          onSuccess={() => { setFormOpen(false); setEditItem(null); fetch(pagination.page); }}
          onCancel={() => { setFormOpen(false); setEditItem(null); }}
        />
      </Modal>
    </div>
  );
}

