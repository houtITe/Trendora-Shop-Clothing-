import { useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiRequestError } from '../../services/api.js';

export default function StaffSettings() {
  const { success: toastSuccess } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [notifyLowStock, setNotifyLowStock] = useState(() => localStorage.getItem('trendora_staff_notify_lowstock') !== 'off');
  const [notifyNewOrder, setNotifyNewOrder] = useState(() => localStorage.getItem('trendora_staff_notify_neworder') !== 'off');
  const [notifyPayment, setNotifyPayment] = useState(() => localStorage.getItem('trendora_staff_notify_payment') !== 'off');

  function toggle(key, value, setter) {
    setter(value);
    localStorage.setItem(key, value ? 'on' : 'off');
  }

  async function submitPassword(e) {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password updated.');
      toastSuccess('Password updated.');
    } catch (err) {
      setMessage(err instanceof ApiRequestError ? err.message : 'Could not update password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h2>Settings</h2>
      <p style={{ color: 'var(--tr-gray)', marginBottom: 20 }}>
        Staff can manage their own login and notification preferences here. System-wide settings are managed by Admin.
      </p>

      <h5 style={{ marginBottom: 10 }}>Change Password</h5>
      <form onSubmit={submitPassword} style={{ maxWidth: 360, marginBottom: 30 }}>
        {message && <div className="tr-admin__stat" style={{ marginBottom: 12, padding: '10px 16px' }}>{message}</div>}
        <label>Current Password</label>
        <input type="password" className="form-control-trendora" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        <label>New Password</label>
        <input type="password" className="form-control-trendora" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters, with a letter and a number" />
        <button type="submit" className="btn-dark-pill" style={{ marginTop: 14 }} disabled={saving}>{saving ? 'Saving...' : 'Update Password'}</button>
      </form>

      <h5 style={{ marginBottom: 10 }}>Notifications</h5>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
          Low Stock Alerts
          <input type="checkbox" checked={notifyLowStock} onChange={(e) => toggle('trendora_staff_notify_lowstock', e.target.checked, setNotifyLowStock)} />
        </label>
        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
          New Order Ready
          <input type="checkbox" checked={notifyNewOrder} onChange={(e) => toggle('trendora_staff_notify_neworder', e.target.checked, setNotifyNewOrder)} />
        </label>
        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
          Payment Success
          <input type="checkbox" checked={notifyPayment} onChange={(e) => toggle('trendora_staff_notify_payment', e.target.checked, setNotifyPayment)} />
        </label>
      </div>
    </>
  );
}
