import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../services/api.js';
import './Staff.css';

export default function StaffOverview() {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [onShift, setOnShift] = useState(() => localStorage.getItem('trendora_staff_shift') === 'on');
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  function toggleShift() {
    const next = !onShift;
    setOnShift(next);
    localStorage.setItem('trendora_staff_shift', next ? 'on' : 'off');
  }

  useEffect(() => {
    (async () => {
      try {
        const [dashboardData, customersData] = await Promise.all([
          api.get('/dashboard/staff'),
          api.get('/users/customers/search'),
        ]);
        setSummary(dashboardData.summary);
        setRecent((dashboardData.recentTransactions || []).map((o) => ({ ...o, total: Number(o.total) })));
        setCustomers(customersData.customers || []);
      } catch (e) {
        toastError('Could not load your dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <h2>Staff Dashboard</h2>
      <p style={{ color: 'var(--tr-gray)', marginBottom: 20 }}>Welcome back, {user.name.split(' ')[0]}.</p>

      <div className="tr-admin__stats">
        <div className="tr-admin__stat">
          <strong>${(summary?.todaysSales ?? 0).toFixed(2)}</strong>
          <span>Today's Sales</span>
        </div>
        <div className="tr-admin__stat">
          <strong>{summary?.todaysTransactions ?? 0}</strong>
          <span>Today's Transactions</span>
        </div>
        <div className="tr-admin__stat">
          <div className="tr-staff__shift">
            <span className={`tr-staff__shift-dot ${onShift ? 'on' : ''}`} />
            <strong style={{ fontSize: '1rem' }}>{onShift ? 'On Shift' : 'Off Shift'}</strong>
          </div>
          <button className="btn-outline-dark-pill" style={{ marginTop: 10, padding: '6px 14px', fontSize: '.78rem' }} onClick={toggleShift}>
            {onShift ? 'Clock Out' : 'Clock In'}
          </button>
        </div>
        <div className="tr-admin__stat">
          <Link to="/staff/pos" className="btn-dark-pill tr-staff__quick-sale">Quick Sale &rarr;</Link>
          <span style={{ display: 'block', marginTop: 8 }}>Jump into POS</span>
        </div>
      </div>

      <h5 style={{ marginBottom: 10 }}>Recent Transactions</h5>
      <div className="tr-admin__table-wrap">
        <table className="tr-admin__table">
          <thead>
            <tr><th>Order #</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            {recent.map((o) => {
              const customer = o.user_id ? customers.find((c) => c.user_id === o.user_id) : null;
              return (
                <tr key={o.order_id}>
                  <td>#{o.order_id}</td>
                  <td>{new Date(o.order_date).toLocaleString()}</td>
                  <td>{customer?.name || 'Walk-in'}</td>
                  <td>${o.total.toFixed(2)}</td>
                  <td><span className="tr-admin__pill tr-admin__pill--customer">{o.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && recent.length === 0 && <div className="tr-admin__empty">No POS transactions yet — head to POS to make your first sale.</div>}
      </div>
    </>
  );
}
