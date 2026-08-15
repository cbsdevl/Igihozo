import { useState, useEffect, useCallback } from 'react';
import { supplierService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from 'react-toastify';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi2';

function SupplierForm({ editItem, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name: '', contact_person: '', phone: '', email: '',
    address: '', city: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        contact_person: editItem.contact_person || '',
        phone: editItem.phone || '',
        email: editItem.email || '',
        address: editItem.address || '',
        city: editItem.city || '',
        notes: editItem.notes || '',
      });
    }
  }, [editItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Supplier name is required'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await supplierService.update(editItem.id, form);
        toast.success('Supplier updated');
      } else {
        await supplierService.create(form);
        toast.success('Supplier created');
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
          <label className="label">Contact Person</label>
          <input value={form.contact_person} onChange={(e) => update('contact_person', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Phone</label>
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">City</label>
          <input value={form.city} onChange={(e) => update('city', e.target.value)} className="input" />
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

export default function SuppliersPage() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
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
      const res = await supplierService.getAll(params);
      setSuppliers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await supplierService.remove(deleteId);
      toast.success('Supplier removed');
      setDeleteId(null);
      fetch(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => (
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{r.name}</p>
        {r.contact_person && <p className="text-xs text-slate-400">Contact: {r.contact_person}</p>}
      </div>
    )},
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email', render: (r) => r.email || '—' },
    { key: 'city', label: 'City', render: (r) => r.city || '—' },
    { key: 'outstanding_balance', label: 'Balance', render: (r) => `${(r.outstanding_balance || 0).toLocaleString()} RWF` },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setEditItem(r); setFormOpen(true); }} className="btn-icon">
          <HiPencil className="w-4 h-4" />
        </button>
        {isAdmin && (
          <button onClick={() => setDeleteId(r.id)} className="btn-icon text-danger-500">
            <HiTrash className="w-4 h-4" />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage medicine suppliers</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="btn-primary">
            <HiPlus className="w-4 h-4" /> Add Supplier
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        searchable
        onSearch={setSearch}
        placeholder="Search suppliers..."
        pagination={pagination}
        onPageChange={(p) => fetch(p)}
      />

      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} title={editItem ? 'Edit Supplier' : 'Add Supplier'} size="lg">
        <SupplierForm
          editItem={editItem}
          onSuccess={() => { setFormOpen(false); setEditItem(null); fetch(pagination.page); }}
          onCancel={() => { setFormOpen(false); setEditItem(null); }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message="Are you sure?"
        loading={deleting}
      />
    </div>
  );
}

