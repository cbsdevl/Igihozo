import { useState, useEffect } from 'react';
import { medicineService, supplierService } from '../../services';
import { toast } from 'react-toastify';

export default function MedicineForm({ editItem, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    barcode: '',
    name: '',
    generic_name: '',
    brand: '',
    category_id: '',
    description: '',
    supplier_id: '',
    purchase_price: '',
    selling_price: '',
    quantity: '',
    min_stock: '10',
    batch_number: '',
    manufacturing_date: '',
    expiry_date: '',
    storage_location: '',
    prescription_required: false,
    status: 'active',
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    medicineService.getCategories().then((r) => setCategories(r.data.data)).catch(() => {});
    supplierService.getAll({ limit: 100 }).then((r) => setSuppliers(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (editItem) {
      setForm({
        barcode: editItem.barcode || '',
        name: editItem.name || '',
        generic_name: editItem.generic_name || '',
        brand: editItem.brand || '',
        category_id: editItem.category_id || '',
        description: editItem.description || '',
        supplier_id: editItem.supplier_id || '',
        purchase_price: editItem.purchase_price || '',
        selling_price: editItem.selling_price || '',
        quantity: editItem.quantity || '',
        min_stock: editItem.min_stock || '10',
        batch_number: editItem.batch_number || '',
        manufacturing_date: editItem.manufacturing_date || '',
        expiry_date: editItem.expiry_date || '',
        storage_location: editItem.storage_location || '',
        prescription_required: !!editItem.prescription_required,
        status: editItem.status || 'active',
      });
    }
  }, [editItem]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.selling_price || parseFloat(form.selling_price) <= 0) errs.selling_price = 'Valid selling price required';
    if (!editItem && (!form.purchase_price || parseFloat(form.purchase_price) < 0)) errs.purchase_price = 'Valid purchase price required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        purchase_price: parseFloat(form.purchase_price) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        quantity: parseInt(form.quantity) || 0,
        min_stock: parseInt(form.min_stock) || 10,
        category_id: form.category_id ? parseInt(form.category_id) : undefined,
        supplier_id: form.supplier_id || undefined,
        prescription_required: form.prescription_required ? 1 : 0,
      };

      if (editItem) {
        await medicineService.update(editItem.id, payload);
        toast.success('Medicine updated');
      } else {
        await medicineService.create(payload);
        toast.success('Medicine created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save medicine');
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label">Name *</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} className={`input ${errors.name ? 'input-error' : ''}`} />
          {errors.name && <p className="text-xs text-danger-500">{errors.name}</p>}
        </div>
        <div className="form-group">
          <label className="label">Barcode</label>
          <input value={form.barcode} onChange={(e) => update('barcode', e.target.value)} className="input" placeholder="Optional" />
        </div>
        <div className="form-group">
          <label className="label">Generic Name</label>
          <input value={form.generic_name} onChange={(e) => update('generic_name', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Brand</label>
          <input value={form.brand} onChange={(e) => update('brand', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Category</label>
          <select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} className="input">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Supplier</label>
          <select value={form.supplier_id} onChange={(e) => update('supplier_id', e.target.value)} className="input">
            <option value="">Select supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Purchase Price *</label>
          <input type="number" min="0" step="0.01" value={form.purchase_price} onChange={(e) => update('purchase_price', e.target.value)} className={`input ${errors.purchase_price ? 'input-error' : ''}`} />
          {errors.purchase_price && <p className="text-xs text-danger-500">{errors.purchase_price}</p>}
        </div>
        <div className="form-group">
          <label className="label">Selling Price *</label>
          <input type="number" min="0" step="0.01" value={form.selling_price} onChange={(e) => update('selling_price', e.target.value)} className={`input ${errors.selling_price ? 'input-error' : ''}`} />
          {errors.selling_price && <p className="text-xs text-danger-500">{errors.selling_price}</p>}
        </div>
        {!editItem && (
          <div className="form-group">
            <label className="label">Initial Quantity</label>
            <input type="number" min="0" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} className="input" />
          </div>
        )}
        <div className="form-group">
          <label className="label">Min Stock Level</label>
          <input type="number" min="0" value={form.min_stock} onChange={(e) => update('min_stock', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Batch Number</label>
          <input value={form.batch_number} onChange={(e) => update('batch_number', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Storage Location</label>
          <input value={form.storage_location} onChange={(e) => update('storage_location', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Manufacturing Date</label>
          <input type="date" value={form.manufacturing_date} onChange={(e) => update('manufacturing_date', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Expiry Date</label>
          <input type="date" value={form.expiry_date} onChange={(e) => update('expiry_date', e.target.value)} className="input" />
        </div>
      </div>

      <div className="form-group">
        <label className="label">Description</label>
        <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="input" rows={2} />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="rx" checked={form.prescription_required} onChange={(e) => update('prescription_required', e.target.checked)} className="rounded border-slate-300" />
        <label htmlFor="rx" className="text-sm text-slate-600 dark:text-slate-300">Prescription Required</label>
      </div>

      {editItem && (
        <div className="form-group">
          <label className="label">Status</label>
          <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : editItem ? 'Update Medicine' : 'Add Medicine'}
        </button>
      </div>
    </form>
  );
}

