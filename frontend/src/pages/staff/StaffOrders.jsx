import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../services/api.js';

const STATUS_OPTIONS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Exchanged', 'Refunded'];

export default function StaffOrders() {
  const { error: toastError } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [channel, setChannel] = useState('All');
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ordersData, customersData] = await Promise.all([
          api.get('/orders?limit=100'),
          api.get('/users/customers/search'),
        ]);
        setOrders((ordersData.orders || []).map((o) => ({ ...o, total: Number(o.total) })));
        setCustomers(customersData.customers || []);
      } catch (e) {
        toastError('Could not load orders.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = [...orders].sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

  const filtered = sorted.filter((o) => {
    const customer = o.user_id ? customers.find((c) => c.user_id === o.user_id) : null;
    const matchesSearch =
      !search ||
      String(o.order_id).includes(search) ||
      customer?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'All' || o.status === status;
    const matchesChannel = channel === 'All' || (o.channel || 'Online') === channel;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  return (
    <>
      <h2>Orders</h2>
      <div className="tr-admin__toolbar">
        <input className="form-control-trendora" placeholder="Search by order # or customer" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="form-control-trendora" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="All">All Channels</option>
            <option value="POS">In-Store (POS)</option>
            <option value="Online">Online</option>
          </select>
          <select className="form-control-trendora" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="tr-admin__table-wrap">
        <table className="tr-admin__table">
          <thead>
            <tr><th>Order #</th><th>Date</th><th>Customer</th><th>Channel</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const customer = o.user_id ? customers.find((c) => c.user_id === o.user_id) : null;
              return (
                <tr key={o.order_id}>
                  <td>#{o.order_id}</td>
                  <td>{new Date(o.order_date).toLocaleString()}</td>
                  <td>{customer?.name || 'Walk-in / Guest'}</td>
                  <td>{o.channel === 'POS' ? 'In-Store' : 'Online'}</td>
                  <td>${o.total.toFixed(2)}</td>
                  <td><span className="tr-admin__pill tr-admin__pill--customer">{o.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <div className="tr-admin__empty">No orders match your filters.</div>}
      </div>
    </>
  );
}
