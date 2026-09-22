import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api, ApiRequestError } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Modal from '../components/common/Modal.jsx';
import './OrderHistory.css';

// MySQL returns DECIMAL columns (total, price, amount) as strings — see the
// same note in CatalogContext/CartContext. Normalize once here.
function normalizeOrder(order) {
  return {
    ...order,
    total: Number(order.total),
    items: (order.items || []).map((d) => ({
      ...d,
      quantity: Number(d.quantity),
      price: Number(d.price),
      product: d.product ? { ...d.product, price: Number(d.product.price) } : null,
    })),
    payments: (order.payments || []).map((p) => ({ ...p, amount: Number(p.amount) })),
  };
}

/**
 * Order History — fetches the logged-in user's orders from
 * GET /api/orders/my-orders (each order already comes back with its line
 * items + product + payments joined server-side).
 */
export default function OrderHistory() {
  const location = useLocation();
  const justPlacedOrderId = location.state?.justPlacedOrderId;
  const { success: toastSuccess, error: toastError } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  async function handleCancelOrder(orderId) {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}? Your order will be cancelled and items restored to stock.`)) {
      return;
    }
    try {
      await api.put(`/orders/${orderId}/cancel`);
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, status: 'Cancelled' } : o))
      );
      toastSuccess(`Order #${orderId} has been cancelled.`);
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not cancel order.');
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/orders/my-orders');
        const normalized = (data.orders || [])
          .map(normalizeOrder)
          .sort((a, b) => b.order_id - a.order_id);
        setOrders(normalized);
      } catch (e) {
        setError(e.message || 'Could not load your orders.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="page-fade container-trendora tr-orders">
      <h1 className="section-title">Order History</h1>

      {loading ? (
        <p className="tr-orders__empty">Loading your orders…</p>
      ) : error ? (
        <p className="tr-orders__empty">{error}</p>
      ) : orders.length === 0 ? (
        <p className="tr-orders__empty">You haven't placed any orders yet.</p>
      ) : (
        <div className="tr-orders__list">
          {orders.map((order) => {
            const payment = order.payments[0];
            return (
              <div className="tr-orders__card" key={order.order_id}>
                <div className="tr-orders__head">
                  <div>
                    <strong>Order #{order.order_id}</strong>
                    {order.order_id === justPlacedOrderId && <span className="tr-orders__new-tag">Just placed</span>}
                    <p>{new Date(order.order_date).toLocaleString()}</p>
                  </div>
                  <span className={`tr-orders__status tr-orders__status--${order.status.toLowerCase()}`}>{order.status}</span>
                </div>

                <div className="tr-orders__items">
                  {order.items.map((d) => (
                    <div className="tr-orders__item" key={d.order_detail_id}>
                      <img src={d.product?.image} alt={d.product?.product_name} />
                      <div>
                        <strong>{d.product?.product_name ?? 'Product removed'}</strong>
                        <span>Qty {d.quantity} &times; ${d.price.toFixed(2)}</span>
                      </div>
                      <span className="tr-orders__item-total">${(d.quantity * d.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="tr-orders__foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span>Payment: {payment ? `${payment.payment_method} (${payment.status})` : 'Not recorded'}</span>
                    {order.shipping_fee > 0 && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--tr-gray)' }}>
                        Delivery fee: ${Number(order.shipping_fee).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <strong>Total: ${order.total.toFixed(2)}</strong>
                    {(order.status === 'Pending' || order.status === 'Processing') && (
                      <button
                        type="button"
                        className="btn-outline-dark-pill"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#c5221f', borderColor: '#fce8e6' }}
                        onClick={() => handleCancelOrder(order.order_id)}
                      >
                        Cancel Order
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-outline-dark-pill"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      onClick={() => setSelectedOrder(order)}
                    >
                      View Receipt
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <Modal title={`Receipt — Order #${selectedOrder.order_id}`} onClose={() => setSelectedOrder(null)}>
          <div id="printable-invoice" className="tr-order-invoice" style={{ fontFamily: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--tr-border)', paddingBottom: 12, marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>TRENDORA</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--tr-gray)' }}>
                  Customer Order Receipt
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Order #{selectedOrder.order_id}</span>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--tr-gray)' }}>
                  {new Date(selectedOrder.order_date).toLocaleString()}
                </p>
                <span className={`tr-orders__status tr-orders__status--${selectedOrder.status.toLowerCase()}`} style={{ marginTop: 4, display: 'inline-block' }}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, padding: '10px 12px', background: '#faf8f5', borderRadius: 8, marginBottom: 14, fontSize: '0.82rem' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--tr-gray)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Payment Method</strong>
                <span style={{ fontWeight: 600 }}>{selectedOrder.payments[0]?.payment_method || 'Standard Checkout'}</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--tr-gray)' }}>Status: {selectedOrder.payments[0]?.status || 'Completed'}</div>
              </div>
              {selectedOrder.shipping_address && (
                <div>
                  <strong style={{ display: 'block', color: 'var(--tr-gray)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Delivery Address</strong>
                  <span style={{ fontWeight: 500 }}>{selectedOrder.shipping_address}</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 70px 70px', gap: 8, paddingBottom: 6, borderBottom: '1px solid var(--tr-border)', fontSize: '0.74rem', fontWeight: 700, color: 'var(--tr-gray)', textTransform: 'uppercase' }}>
                <span>Item</span>
                <span style={{ textAlign: 'center' }}>Qty</span>
                <span style={{ textAlign: 'right' }}>Price</span>
                <span style={{ textAlign: 'right' }}>Total</span>
              </div>
              {selectedOrder.items.map((d) => (
                <div key={d.order_detail_id} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 70px 70px', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #eee', fontSize: '0.82rem' }}>
                  <div>
                    <strong style={{ display: 'block' }}>{d.product?.product_name ?? 'Product'}</strong>
                    {d.product?.size && <span style={{ fontSize: '0.72rem', color: 'var(--tr-gray)' }}>Size: {d.product.size} {d.product.color ? `· ${d.product.color}` : ''}</span>}
                  </div>
                  <span style={{ textAlign: 'center' }}>{d.quantity}</span>
                  <span style={{ textAlign: 'right' }}>${d.price.toFixed(2)}</span>
                  <span style={{ textAlign: 'right', fontWeight: 600 }}>${(d.quantity * d.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', paddingTop: 6, borderTop: '1px solid var(--tr-border)' }}>
              {selectedOrder.shipping_fee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: 200, fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--tr-gray)' }}>Delivery Fee:</span>
                  <span>${Number(selectedOrder.shipping_fee).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: 200, fontSize: '1rem', fontWeight: 800, marginTop: 4, paddingTop: 4, borderTop: '1px solid #ddd' }}>
                <span>Total Paid:</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--tr-border)' }}>
            <button className="btn-outline-dark-pill" onClick={() => setSelectedOrder(null)}>Close</button>
            <button className="btn-dark-pill" onClick={() => window.print()}>Print Receipt</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
