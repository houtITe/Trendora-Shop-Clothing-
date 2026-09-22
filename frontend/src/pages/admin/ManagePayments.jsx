import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../services/api.js';

/**
 * There's no standalone "list all payments" endpoint on the backend —
 * payments are only ever returned nested inside an order (order.payments).
 * So this page fetches all orders and flattens their payments out, and
 * shows status as a read-only badge rather than an editable dropdown (there
 * is likewise no "update payment status" endpoint to wire it to).
 */
export default function ManagePayments() {
  const { error: toastError } = useToast();
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ordersData, usersData] = await Promise.all([
          api.get('/orders?limit=100'),
          api.get('/users?limit=100'),
        ]);
        const flattened = (ordersData.orders || []).flatMap((o) =>
          (o.payments || []).map((p) => ({ ...p, amount: Number(p.amount), order_id: o.order_id, user_id: o.user_id }))
        );
        setPayments(flattened);
        setUsers(usersData.users || []);
      } catch (e) {
        toastError('Could not load payments.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = [...payments].sort((a, b) => b.payment_id - a.payment_id);
  const totalCollected = payments.filter((p) => p.status === 'Completed').reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <h2>Manage Payments</h2>
      <div className="tr-admin__toolbar">
        <span style={{ color: 'var(--tr-gray)' }}>{payments.length} payments &middot; ${totalCollected.toFixed(2)} collected</span>
      </div>

      {loading ? (
        <div className="tr-admin__empty">Loading payments…</div>
      ) : (
        <div className="tr-admin__table-wrap">
          <table className="tr-admin__table">
            <thead><tr><th>Payment ID</th><th>Order</th><th>Customer</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.payment_id}>
                  <td>#{p.payment_id}</td>
                  <td>#{p.order_id}</td>
                  <td>{p.user_id ? (users.find((u) => u.user_id === p.user_id)?.name ?? 'Deleted user') : 'Walk-in / Guest'}</td>
                  <td>${p.amount.toFixed(2)}</td>
                  <td>{p.payment_method}</td>
                  <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td><span className={`tr-admin__pill tr-admin__pill--${p.status.toLowerCase()}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <div className="tr-admin__empty">No payments recorded yet.</div>}
        </div>
      )}
    </>
  );
}
