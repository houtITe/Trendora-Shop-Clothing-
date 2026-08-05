import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiRequestError } from '../../services/api.js';
import Modal from '../../components/common/Modal.jsx';

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Exchanged', 'Refunded'];

function normalizeOrder(o) {
  return {
    ...o,
    total: Number(o.total),
    items: (o.items || []).map((d) => ({ ...d, quantity: Number(d.quantity), price: Number(d.price) })),
  };
}

export default function ManageOrders() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [ordersData, usersData] = await Promise.all([
        api.get('/orders?limit=100'),
        api.get('/users?limit=100'),
      ]);
      setOrders((ordersData.orders || []).map(normalizeOrder));
      setUsers(usersData.users || []);
    } catch (err) {
      toastError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function changeStatus(id, status) {
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.order_id === id ? { ...o, status } : o)));
      toastSuccess(`Order #${id} marked ${status}.`);
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not update order status.');
    }
  }

  // The backend has no hard-delete for orders (financial records shouldn't
  // just disappear) — the closest real equivalent is cancelling it.
  async function handleCancel(id) {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    try {
      await api.put(`/orders/${id}/cancel`);
      setOrders((prev) => prev.map((o) => (o.order_id === id ? { ...o, status: 'Cancelled' } : o)));
      toastSuccess(`Order #${id} cancelled.`);
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not cancel order.');
    }
  }

  const sorted = [...orders].sort((a, b) => b.order_id - a.order_id);
  const viewingOrder = orders.find((o) => o.order_id === viewing);

  return (
    <>
      <h2>Manage Orders</h2>
      <div className="tr-admin__toolbar">
        <span style={{ color: 'var(--tr-gray)' }}>{orders.length} orders</span>
      </div>

      {loading ? (
        <div className="tr-admin__empty">Loading orders…</div>
      ) : (
        <div className="tr-admin__table-wrap">
          <table className="tr-admin__table">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {sorted.map((o) => (
                <tr key={o.order_id}>
                  <td>#{o.order_id}</td>
                  <td>{users.find((u) => u.user_id === o.user_id)?.name ?? 'Deleted user'}</td>
                  <td>{new Date(o.order_date).toLocaleDateString()}</td>
                  <td>${o.total.toFixed(2)}</td>
                  <td>
                    <select className="form-control-trendora" style={{ padding: '4px 8px' }} value={o.status} onChange={(e) => changeStatus(o.order_id, e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="tr-admin__actions-cell">
                    <button onClick={() => setViewing(o.order_id)}>View</button>
                    <button className="danger" onClick={() => handleCancel(o.order_id)} disabled={o.status === 'Cancelled'}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <div className="tr-admin__empty">No orders placed yet.</div>}
        </div>
      )}

      {viewingOrder && (
        <Modal title={`Order #${viewing} Details`} onClose={() => setViewing(null)}>
          {viewingOrder.items.map((d) => (
            <div key={d.order_detail_id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <img src={d.product?.image} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
              <div style={{ flex: 1 }}>
                <strong>{d.product?.product_name ?? 'Product removed'}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--tr-gray)' }}>Qty {d.quantity} &times; ${d.price.toFixed(2)}</div>
              </div>
              <strong>${(d.quantity * d.price).toFixed(2)}</strong>
            </div>
          ))}
        </Modal>
      )}
    </>
  );
}
