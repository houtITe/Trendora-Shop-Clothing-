import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiRequestError } from '../../services/api.js';
import Modal from '../../components/common/Modal.jsx';

export default function StaffCustomers() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [customersData, ordersData] = await Promise.all([
        api.get('/users/customers/search'),
        api.get('/orders?limit=100'),
      ]);
      setCustomers(customersData.customers || []);
      setOrders(ordersData.orders || []);
    } catch (e) {
      toastError('Could not load customers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submitWalkIn(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post('/users', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        role: 'customer',
      });
      toastSuccess('Walk-in customer added.');
      setForm({ name: '', phone: '', address: '' });
      setAdding(false);
      await load();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not add customer.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <>
      <h2>Customers</h2>
      <div className="tr-admin__toolbar">
        <input className="form-control-trendora" placeholder="Search by name, email, or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-tan" onClick={() => setAdding(true)}>+ New Walk-in Customer</button>
      </div>

      <div className="tr-admin__table-wrap">
        <table className="tr-admin__table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th></tr></thead>
          <tbody>
            {filtered.map((c) => {
              const orderCount = orders.filter((o) => o.user_id === c.user_id).length;
              return (
                <tr key={c.user_id}>
                  <td>{c.name} {c.walk_in && <span className="tr-admin__pill tr-admin__pill--customer">walk-in</span>}</td>
                  <td>{c.walk_in ? '—' : c.email}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{orderCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <div className="tr-admin__empty">No customers found.</div>}
      </div>

      {adding && (
        <Modal title="New Walk-in Customer" onClose={() => setAdding(false)}>
          <form onSubmit={submitWalkIn}>
            <label>Name</label>
            <input className="form-control-trendora" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            <label>Phone</label>
            <input className="form-control-trendora" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <label>Address</label>
            <input className="form-control-trendora" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div className="tr-modal__actions">
              <button type="submit" className="btn-dark-pill" disabled={saving}>{saving ? 'Saving...' : 'Add Customer'}</button>
              <button type="button" className="btn-outline-dark-pill" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
