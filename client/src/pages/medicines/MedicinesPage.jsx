import { useState, useEffect, useCallback } from 'react';
import { medicineService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import MedicineForm from './MedicineForm';
import StockAdjustModal from './StockAdjustModal';
import { toast } from 'react-toastify';
import { HiPlus, HiPencil, HiTrash, HiAdjustmentsHorizontal, HiLink } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function MedicinesPage() {
  const { isAdmin } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categories, setCategories] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20, search, status: statusFilter || undefined };
      if (categoryFilter) params.category = categoryFilter;
      const res = await medicineService.getAll(params);
      setMedicines(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    medicineService.getCategories().then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await medicineService.remove(deleteId);
      toast.success('Medicine deleted');
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
        {r.generic_name && <p className="text-xs text-slate-400">{r.generic_name}</p>}
      </div>
    )},
    { key: 'barcode', label: 'Barcode', render: (r) => r.barcode || '—' },
    { key: 'category_name', label: 'Category', render: (r) => r.category_name ? <span className="badge-info">{r.category_name}</span> : '—' },
    { key: 'quantity', label: 'Stock', render: (r) => {
      const low = r.quantity <= r.min_stock;
      return <span className={`font-medium ${low ? 'text-danger-600' : 'text-slate-700 dark:text-slate-200'}`}>{r.quantity}</span>;
    }},
    { key: 'selling_price', label: 'Price', render: (r) => `${r.selling_price?.toLocaleString()} RWF` },
    { key: 'expiry_date', label: 'Expiry', render: (r) => {
      if (!r.expiry_date) return '—';
      const d = new Date(r.expiry_date);
      const isExpired = d < new Date();
      return <span className={`text-xs ${isExpired ? 'text-danger-600 font-medium' : ''}`}>{format(d, 'MMM d, yyyy')}</span>;
    }},
    { key: 'status', label: 'Status', render: (r) => {
      const cls = r.status === 'active' ? 'badge-success' : r.status === 'inactive' ? 'badge-gray' : 'badge-danger';
      return <span className={cls}>{r.status}</span>;
    }},
    { key: 'actions', label: 'Actions', render: (r) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setEditItem(r); setFormOpen(true); }} className="btn-icon" title="Edit">
          <HiPencil className="w-4 h-4" />
        </button>
        <button onClick={() => { setAdjustItem(r); setAdjustOpen(true); }} className="btn-icon" title="Adjust Stock">
          <HiAdjustmentsHorizontal className="w-4 h-4" />
        </button>
        {isAdmin && (
          <button onClick={() => setDeleteId(r.id)} className="btn-icon text-danger-500" title="Delete">
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
          <h1 className="page-title">Medicines</h1>
          <p className="page-subtitle">Manage your pharmacy inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/medicines/categories" className="btn-ghost">
            <HiLink className="w-4 h-4" /> Categories
          </Link>
          <button onClick={() => { setEditItem(null); setFormOpen(true); }} className="btn-primary">
            <HiPlus className="w-4 h-4" /> Add Medicine
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input w-auto">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discontinued">Discontinued</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={medicines}
        loading={loading}
        searchable
        onSearch={setSearch}
        placeholder="Search by name, barcode, brand..."
        pagination={pagination}
        onPageChange={(p) => fetch(p)}
      />

      {/* Medicine Form Modal */}
      <Modal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditItem(null); }} title={editItem ? 'Edit Medicine' : 'Add Medicine'} size="xl">
        <MedicineForm
          editItem={editItem}
          onSuccess={() => { setFormOpen(false); setEditItem(null); fetch(pagination.page); }}
          onCancel={() => { setFormOpen(false); setEditItem(null); }}
        />
      </Modal>

      {/* Stock Adjust Modal */}
      <Modal isOpen={adjustOpen} onClose={() => { setAdjustOpen(false); setAdjustItem(null); }} title={`Adjust Stock: ${adjustItem?.name}`} size="md">
        <StockAdjustModal
          medicine={adjustItem}
          onSuccess={() => { setAdjustOpen(false); setAdjustItem(null); fetch(pagination.page); }}
          onCancel={() => { setAdjustOpen(false); setAdjustItem(null); }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Medicine"
        message="Are you sure you want to delete this medicine? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}

