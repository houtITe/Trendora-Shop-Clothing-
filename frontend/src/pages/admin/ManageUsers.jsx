import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiRequestError } from '../../services/api.js';
import Modal from '../../components/common/Modal.jsx';

const EMPTY = { name: '', email: '', password: '', role: 'customer', phone: '', address: '' };

export default function ManageUsers() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/users?limit=100');
      setUsers(data.users || []);
    } catch (e) {
      toastError('Could not load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(EMPTY); setAdding(true); }
  function openEdit(u) {
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      phone: u.phone || '',
      address: u.address || '',
    });
    setEditing(u.user_id);
  }
  function closeModal() { setAdding(false); setEditing(null); }

  async function submitAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/users', form);
      await load();
      toastSuccess('User added successfully.');
      closeModal();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not add user.');
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // Only send the password field if the admin actually typed a new one
      // — an empty string would otherwise overwrite it with a blank hash.
      const { password, ...rest } = form;
      const payload = password ? { ...rest, password } : rest;
      await api.put(`/users/${editing}`, payload);
      await load();
      toastSuccess('User updated successfully.');
      closeModal();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not update user.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${id}`);
      await load();
      toastSuccess('User deleted.');
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not delete user.');
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <h2>Manage Users</h2>
      <div className="tr-admin__toolbar">
        <input className="form-control-trendora" placeholder="Search by name, email, or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-tan" onClick={openAdd}>+ Add User</button>
      </div>

      {loading ? (
        <div className="tr-admin__empty">Loading users…</div>
      ) : (
        <div className="tr-admin__table-wrap">
          <table className="tr-admin__table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.user_id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`tr-admin__pill tr-admin__pill--${u.role}`}>{u.role}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{u.phone || '—'}</td>
                  <td className="tr-admin__actions-cell">
                    <button onClick={() => openEdit(u)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(u.user_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="tr-admin__empty">No users found.</div>}
        </div>
      )}

      {(adding || editing !== null) && (
        <Modal title={adding ? 'Add User' : 'Edit User'} onClose={closeModal}>
          <form onSubmit={adding ? submitAdd : submitEdit}>
            <label>Name</label>
            <input className="form-control-trendora" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <label>Email</label>
            <input type="email" className="form-control-trendora" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!adding} />
            <label>Password {!adding && <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.78rem' }}>(leave blank to keep current password)</span>}</label>
            <input
              type="password"
              className="form-control-trendora"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={adding ? 'At least 6 characters' : ''}
              required={adding}
            />
            <label>Role</label>
            <select className="form-control-trendora" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="customer">customer</option>
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
            <label>Phone</label>
            <input className="form-control-trendora" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <label>Address</label>
            <input className="form-control-trendora" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div className="tr-modal__actions">
              <button type="submit" className="btn-dark-pill" disabled={saving}>{saving ? 'Saving...' : adding ? 'Add User' : 'Save Changes'}</button>
              <button type="button" className="btn-outline-dark-pill" onClick={closeModal}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
