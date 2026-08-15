import { useState } from 'react';
import { medicineService } from '../../services';
import { toast } from 'react-toastify';

export default function StockAdjustModal({ medicine, onSuccess, onCancel }) {
  const [adjustment, setAdjustment] = useState('');
  const [action, setAction] = useState('adjustment');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const adj = parseInt(adjustment);
    if (!adj || adj === 0) {
      toast.error('Adjustment must be a non-zero integer');
      return;
    }
    if (medicine.quantity + adj < 0) {
      toast.error('Resulting quantity would be negative');
      return;
    }
    setSaving(true);
    try {
      await medicineService.adjustQuantity(medicine.id, { adjustment: adj, action, notes });
      toast.success(`Stock adjusted by ${adj}`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <strong>{medicine?.name}</strong> — Current Stock: <strong className="text-lg">{medicine?.quantity}</strong>
        </p>
      </div>

      <div className="form-group">
        <label className="label">Action Type</label>
        <select value={action} onChange={(e) => setAction(e.target.value)} className="input">
          <option value="adjustment">Manual Adjustment</option>
          <option value="purchase">Stock In (Purchase)</option>
          <option value="damage">Damaged</option>
          <option value="return">Return</option>
          <option value="expiry_write_off">Expiry Write-off</option>
        </select>
      </div>

      <div className="form-group">
        <label className="label">Adjustment Quantity</label>
        <input
          type="number"
          value={adjustment}
          onChange={(e) => setAdjustment(e.target.value)}
          className="input"
          placeholder="Positive to add, negative to subtract"
          required
        />
        <p className="text-xs text-slate-400">Use positive numbers for stock-in, negative for stock-out</p>
      </div>

      <div className="form-group">
        <label className="label">Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Adjusting...' : 'Adjust Stock'}
        </button>
      </div>
    </form>
  );
}

