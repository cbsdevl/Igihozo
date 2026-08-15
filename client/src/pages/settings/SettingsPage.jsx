import { useState, useEffect } from 'react';
import { settingsService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';
import { HiArrowDownTray } from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    settingsService.getAll()
      .then((res) => {
        const map = {};
        (res.data.data || []).forEach((s) => { map[s.key] = s.value; });
        setSettings(map);
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  function updateSetting(key, value) {
    setSettings(function(prev) {
      var updated = {};
      for (var k in prev) { updated[k] = prev[k]; }
      updated[key] = value;
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await settingsService.update(settings);
      toast.success('Settings saved');
    } catch (err) {
      var msg = 'Failed to save';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleBackup() {
    try {
      await settingsService.backup();
      toast.success('Backup created');
    } catch (_) {
      toast.error('Backup failed');
    }
  }

  if (!isAdmin) {
    return <p className="text-slate-400 text-center py-12">Admin access required</p>;
  }

  if (loading) {
    return <LoadingSpinner className="py-12" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage pharmacy information</p>
      </div>
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800">Pharmacy Information</h3>
        <div className="form-group">
          <label className="label">Pharmacy Name</label>
          <input value={settings.pharmacy_name || ''} onChange={function(e) { updateSetting('pharmacy_name', e.target.value); }} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Address</label>
          <input value={settings.pharmacy_address || ''} onChange={function(e) { updateSetting('pharmacy_address', e.target.value); }} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Phone</label>
          <input value={settings.pharmacy_phone || ''} onChange={function(e) { updateSetting('pharmacy_phone', e.target.value); }} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Currency</label>
          <input value={settings.currency || 'RWF'} onChange={function(e) { updateSetting('currency', e.target.value); }} className="input" />
        </div>
        <div className="form-group">
          <label className="label">Receipt Footer</label>
          <textarea value={settings.receipt_footer || ''} onChange={function(e) { updateSetting('receipt_footer', e.target.value); }} className="input" rows={2} />
        </div>
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      <div className="card space-y-4">
        <h3 className="font-semibold text-slate-800">Backup</h3>
        <p className="text-sm text-slate-400">Create a backup of the database</p>
        <button onClick={handleBackup} className="btn-secondary">
          <HiArrowDownTray className="w-4 h-4" />
          Create Backup
        </button>
      </div>
    </div>
  );
}
