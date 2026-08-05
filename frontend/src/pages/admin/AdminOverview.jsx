import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../services/api.js';

const COLORS = ['#f4a261', '#1a56c4', '#2e7d32', '#c0392b', '#8b5cf6', '#0891b2'];

function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export default function AdminOverview() {
  const { products, categories } = useCatalog();
  const { error: toastError } = useToast();
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // /dashboard gives accurate totals (aggregate SQL over ALL rows);
        // /orders?limit=100 gives us enough raw orders to build the charts
        // below (revenue trend, status breakdown, top products) client-side.
        const [dashboardData, ordersData] = await Promise.all([
          api.get('/dashboard'),
          api.get('/orders?limit=100'),
        ]);
        setSummary(dashboardData.summary);
        setOrders(
          (ordersData.orders || []).map((o) => ({
            ...o,
            total: Number(o.total),
            items: (o.items || []).map((d) => ({ ...d, quantity: Number(d.quantity) })),
          }))
        );
      } catch (e) {
        toastError('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !summary) {
    return (
      <>
        <h2>Dashboard Overview</h2>
        <p style={{ color: 'var(--tr-gray)' }}>Loading…</p>
      </>
    );
  }

  // --- Revenue trend, last 7 days (excludes cancelled orders) ---
  const revenueChartData = lastNDays(7).map((d) => {
    const key = d.toDateString();
    const dayTotal = orders
      .filter((o) => o.status !== 'Cancelled' && o.order_date && new Date(o.order_date).toDateString() === key)
      .reduce((sum, o) => sum + o.total, 0);
    return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), revenue: Number(dayTotal.toFixed(2)) };
  });

  // --- Orders by status ---
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({ name: status, value: count }));

  // --- Top 5 products by units sold ---
  const qtyByProduct = new Map();
  orders.forEach((o) => o.items.forEach((d) => {
    qtyByProduct.set(d.product_id, (qtyByProduct.get(d.product_id) || 0) + d.quantity);
  }));
  const topProducts = [...qtyByProduct.entries()]
    .map(([productId, qty]) => ({
      name: products.find((p) => p.product_id === productId)?.product_name || `#${productId}`,
      units: qty,
    }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  // --- Products per category ---
  const categoryData = categories.map((c) => ({
    name: c.category_name,
    products: products.filter((p) => p.category_id === c.category_id).length,
  }));

  return (
    <>
      <h2>Dashboard Overview</h2>

      <div className="tr-admin__stats">
        <div className="tr-admin__stat"><strong>${summary.totalRevenue.toFixed(2)}</strong><span>Total Revenue</span></div>
        <div className="tr-admin__stat"><strong>{summary.totalOrders}</strong><span>Total Orders</span></div>
        <div className="tr-admin__stat"><strong>{summary.totalProducts}</strong><span>Total Products</span></div>
        <div className="tr-admin__stat"><strong>{summary.totalUsers}</strong><span>Total Users</span></div>
      </div>

      {orders.length >= 100 && (
        <p style={{ fontSize: '0.78rem', color: 'var(--tr-gray)', margin: '4px 0 12px' }}>
          Charts below are based on the most recent 100 orders (revenue totals above cover everything).
        </p>
      )}

      <div className="tr-charts-grid">
        <div className="tr-chart-card tr-chart-card--wide">
          <h4>Revenue — Last 7 Days</h4>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f4a261" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f4a261" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#f4a261" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="tr-chart-card">
          <h4>Orders by Status</h4>
          {statusData.length === 0 ? (
            <p className="tr-chart-card__empty">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {statusData.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="tr-chart-card">
          <h4>Top 5 Products (Units Sold)</h4>
          {topProducts.length === 0 ? (
            <p className="tr-chart-card__empty">No sales recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="units" fill="#1a56c4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="tr-chart-card">
          <h4>Products per Category</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="products" fill="#2e7d32" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
