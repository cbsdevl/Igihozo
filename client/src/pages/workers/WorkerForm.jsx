import { useState, useEffect } from 'react';
import { workerService } from '../../services';
import { toast } from 'react-toastify';

export default function WorkerForm({ editItem, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({
        username: editItem.username || '',
        full_name: editItem.full_name || '',
        email: editItem.email || '',
        phone: editItem.phone || '',
        password: '',
        is_active: !!editItem.is_active,
      });
    }
  }, [editItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.username.trim()) {
      toast.error('Name and username are required');
      return;
    }
    if (!editItem && form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, is_active: form.is_active ? 1 : 0 };
      if (!payload.password) delete payload.password;

      if (editItem) {
        await workerService.update(editItem.id, payload);
        toast.success('Worker updated');
      } else {
        await workerService.create(payload);
        toast.success('Worker created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label">Full Name *</label>
          <input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className="input" required />
        </div>
        <div className="form-group">
          <label className="label">Username *</label>
          <input value={form.username} onChange={(e) => update('username', e.target.value)} className="input" required disabled={!!editItem} />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Phone</label>
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label className="label">{editItem ? 'New Password (leave blank to keep)' : 'Password *'}</label>
          <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className="input" placeholder={editItem ? 'Leave blank to keep' : 'At least 6 chars'} required={!editItem} />
        </div>
        <div className="form-group">
          <label className="label">Active</label>
          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => update('is_active', e.target.checked)} className="rounded border-slate-300" />
            <span className="text-sm text-slate-600 dark:text-slate-300">Account is active</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : editItem ? 'Update Worker' : 'Add Worker'}
        </button>
      </div>
    </form>
  );
}

