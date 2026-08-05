import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api.js';
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

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

                <div className="tr-orders__foot">
                  <span>Payment: {payment ? `${payment.payment_method} (${payment.status})` : 'Not recorded'}</span>
                  <strong>Total: ${order.total.toFixed(2)}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
