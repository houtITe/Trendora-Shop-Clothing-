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
                  <td>{o.user_id ? (users.find((u) => u.user_id === o.user_id)?.name ?? 'Deleted user') : 'Walk-in / Guest'}</td>
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
        <Modal title={`Order #${viewing} Invoice & Details`} onClose={() => setViewing(null)}>
          <div id="printable-invoice" className="tr-order-invoice" style={{ fontFamily: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--tr-border)', paddingBottom: 14, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.04em' }}>TRENDORA</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--tr-gray)' }}>
                  Fashion & Clothing Store · Official Invoice
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Invoice #{viewingOrder.order_id}</span>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--tr-gray)' }}>
                  {new Date(viewingOrder.order_date).toLocaleString()}
                </p>
                <span className={`tr-admin__pill tr-admin__pill--${viewingOrder.status.toLowerCase()}`} style={{ marginTop: 4, display: 'inline-block' }}>
                  {viewingOrder.status}
                </span>
              </div>
            </div>

            {/* Customer & Order Information */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, padding: '10px 14px', background: '#faf8f5', borderRadius: 8, marginBottom: 16, fontSize: '0.82rem' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--tr-gray)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Customer</strong>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  {viewingOrder.user_id ? (users.find((u) => u.user_id === viewingOrder.user_id)?.name ?? 'Customer') : 'Walk-in / Guest Customer'}
                </div>
                {viewingOrder.user_id && users.find((u) => u.user_id === viewingOrder.user_id)?.email && (
                  <div style={{ color: 'var(--tr-gray)', fontSize: '0.78rem' }}>{users.find((u) => u.user_id === viewingOrder.user_id)?.email}</div>
                )}
                {viewingOrder.user_id && users.find((u) => u.user_id === viewingOrder.user_id)?.phone && (
                  <div style={{ color: 'var(--tr-gray)', fontSize: '0.78rem' }}>{users.find((u) => u.user_id === viewingOrder.user_id)?.phone}</div>
                )}
              </div>

              <div>
                <strong style={{ display: 'block', color: 'var(--tr-gray)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Channel & Cashier</strong>
                <div style={{ fontWeight: 600, marginTop: 2 }}>{viewingOrder.channel || 'Online Store'}</div>
                {viewingOrder.cashier_id && (
                  <div style={{ color: 'var(--tr-gray)', fontSize: '0.78rem' }}>
                    Cashier: {users.find((u) => u.user_id === viewingOrder.cashier_id)?.name || `#${viewingOrder.cashier_id}`}
                  </div>
                )}
              </div>

              <div>
                <strong style={{ display: 'block', color: 'var(--tr-gray)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Payment Method</strong>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  {viewingOrder.payments?.[0]?.payment_method || 'Recorded upon delivery'}
                </div>
                <div style={{ color: 'var(--tr-gray)', fontSize: '0.78rem' }}>
                  Status: {viewingOrder.payments?.[0]?.status || 'Completed'}
                </div>
              </div>

              {viewingOrder.shipping_address && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong style={{ display: 'block', color: 'var(--tr-gray)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Shipping Destination</strong>
                  <div style={{ fontWeight: 500, marginTop: 2 }}>{viewingOrder.shipping_address}</div>
                </div>
              )}
            </div>

            {/* Items List */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px 80px 80px', gap: 8, paddingBottom: 6, borderBottom: '1px solid var(--tr-border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--tr-gray)', textTransform: 'uppercase' }}>
                <span>Item</span>
                <span>Description</span>
                <span style={{ textAlign: 'center' }}>Qty</span>
                <span style={{ textAlign: 'right' }}>Unit Price</span>
                <span style={{ textAlign: 'right' }}>Total</span>
              </div>
              {viewingOrder.items.map((d) => (
                <div key={d.order_detail_id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px 80px 80px', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #eee', fontSize: '0.82rem' }}>
                  <img
                    src={d.product?.image}
                    alt=""
                    style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, background: '#f5f5f5' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div>
                    <strong style={{ display: 'block' }}>{d.product?.product_name ?? 'Product removed'}</strong>
                    {d.product?.sku && <span style={{ fontSize: '0.72rem', color: 'var(--tr-gray)' }}>SKU: {d.product.sku}</span>}
                  </div>
                  <span style={{ textAlign: 'center' }}>{d.quantity}</span>
                  <span style={{ textAlign: 'right' }}>${d.price.toFixed(2)}</span>
                  <span style={{ textAlign: 'right', fontWeight: 600 }}>${(d.quantity * d.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--tr-border)' }}>
              {viewingOrder.shipping_fee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: 220, fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--tr-gray)' }}>Delivery Fee:</span>
                  <span>${Number(viewingOrder.shipping_fee).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: 220, fontSize: '1.05rem', fontWeight: 800, marginTop: 4, paddingTop: 4, borderTop: '1px solid #ddd' }}>
                <span>Grand Total:</span>
                <span>${viewingOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 12, borderTop: '1px solid var(--tr-border)' }}>
            <button className="btn-outline-dark-pill" onClick={() => setViewing(null)}>Close</button>
            <button className="btn-dark-pill" onClick={() => window.print()}>Print Invoice</button>
          </div>
        </Modal>
      )}
    </>
  );
}
