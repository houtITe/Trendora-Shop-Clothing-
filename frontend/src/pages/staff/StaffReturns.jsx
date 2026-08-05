import { useEffect, useState } from 'react';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiRequestError } from '../../services/api.js';

export default function StaffReturns() {
  const { products } = useCatalog();
  const { success: toastSuccess, error: toastError } = useToast();
  const [orderIdInput, setOrderIdInput] = useState('');
  const [order, setOrder] = useState(null);
  const [details, setDetails] = useState([]);
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState('return'); // 'return' | 'exchange'
  const [exchangeProductId, setExchangeProductId] = useState('');
  const [selected, setSelected] = useState({}); // { order_detail_id: qty }
  const [done, setDone] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [returns, setReturns] = useState([]);

  async function loadRecent() {
    try {
      const data = await api.get('/returns?limit=10');
      setReturns(data.returns || []);
    } catch (e) {
      toastError('Could not load recent returns.');
    }
  }

  useEffect(() => { loadRecent(); }, []);

  async function findOrder(e) {
    e.preventDefault();
    const id = Number(orderIdInput);
    if (!id) return;
    try {
      const data = await api.get(`/orders/${id}`);
      setOrder(data.order);
      setDetails((data.order.items || []).map((d) => ({ ...d, quantity: Number(d.quantity), price: Number(d.price) })));
      setSelected({});
      setDone(null);
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : `Order #${id} not found.`);
    }
  }

  function toggleSelect(od, checked) {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[od.order_detail_id] = od.quantity;
      else delete next[od.order_detail_id];
      return next;
    });
  }

  async function submitReturn(e) {
    e.preventDefault();
    const items = details.filter((d) => selected[d.order_detail_id]);
    if (items.length === 0) {
      toastError('Select at least one item to process.');
      return;
    }
    setSubmitting(true);
    try {
      // The backend processes one line item per call, so we submit them in
      // sequence (each call updates stock immediately for that item).
      for (const od of items) {
        const qty = Number(selected[od.order_detail_id]) || od.quantity;
        await api.post('/returns', {
          order_id: order.order_id,
          product_id: od.product_id,
          quantity: qty,
          type: mode,
          reason,
          exchange_product_id: mode === 'exchange' && exchangeProductId ? Number(exchangeProductId) : null,
        });
      }
      toastSuccess(`${items.length} item(s) ${mode === 'exchange' ? 'exchanged' : 'returned'} successfully.`);
      setDone({ mode, count: items.length });
      setOrder(null);
      setDetails([]);
      setSelected({});
      setReason('');
      setOrderIdInput('');
      await loadRecent();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not process the return.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h2>Returns & Exchanges</h2>

      <form onSubmit={findOrder} className="tr-admin__toolbar">
        <input
          className="form-control-trendora"
          placeholder="Enter Order # to look up"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
        />
        <button type="submit" className="btn-tan">Find Order</button>
      </form>

      {done && (
        <div className="tr-admin__stat" style={{ marginBottom: 20 }}>
          {done.count} item(s) {done.mode === 'exchange' ? 'exchanged' : 'returned'} successfully. Stock has been updated.
        </div>
      )}

      {order && (
        <form onSubmit={submitReturn}>
          <div className="tr-admin__table-wrap" style={{ marginBottom: 16 }}>
            <table className="tr-admin__table">
              <thead>
                <tr><th></th><th>Product</th><th>Qty Purchased</th><th>Price</th><th>Qty to Process</th></tr>
              </thead>
              <tbody>
                {details.map((od) => {
                  const isSelected = od.order_detail_id in selected;
                  return (
                    <tr key={od.order_detail_id}>
                      <td>
                        <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(od, e.target.checked)} />
                      </td>
                      <td>{od.product?.product_name || `#${od.product_id}`}</td>
                      <td>{od.quantity}</td>
                      <td>${od.price?.toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          max={od.quantity}
                          disabled={!isSelected}
                          value={selected[od.order_detail_id] ?? od.quantity}
                          onChange={(e) => setSelected((prev) => ({ ...prev, [od.order_detail_id]: e.target.value }))}
                          style={{ width: 60 }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
            <div>
              <label>Type</label><br />
              <select className="form-control-trendora" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="return">Return / Refund</option>
                <option value="exchange">Exchange</option>
              </select>
            </div>
            {mode === 'exchange' && (
              <div>
                <label>Exchange for</label><br />
                <select className="form-control-trendora" value={exchangeProductId} onChange={(e) => setExchangeProductId(e.target.value)}>
                  <option value="">Select replacement product…</option>
                  {products.map((p) => <option key={p.product_id} value={p.product_id}>{p.product_name} (stock {p.stock})</option>)}
                </select>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 220 }}>
              <label>Reason</label><br />
              <input className="form-control-trendora" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. wrong size, defective" />
            </div>
          </div>

          <button type="submit" className="btn-dark-pill" disabled={submitting}>
            {submitting ? 'Processing...' : `Process ${mode === 'exchange' ? 'Exchange' : 'Return'}`}
          </button>
        </form>
      )}

      <h5 style={{ margin: '30px 0 10px' }}>Recent Returns</h5>
      <div className="tr-admin__table-wrap">
        <table className="tr-admin__table">
          <thead><tr><th>Date</th><th>Order #</th><th>Product</th><th>Qty</th><th>Type</th><th>Reason</th></tr></thead>
          <tbody>
            {returns.map((r) => {
              const product = products.find((p) => p.product_id === r.product_id);
              return (
                <tr key={r.return_id}>
                  <td>{new Date(r.return_date).toLocaleDateString()}</td>
                  <td>#{r.order_id}</td>
                  <td>{product?.product_name || `#${r.product_id}`}</td>
                  <td>{r.quantity}</td>
                  <td><span className="tr-admin__pill tr-admin__pill--customer">{r.type}</span></td>
                  <td>{r.reason || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {returns.length === 0 && <div className="tr-admin__empty">No returns processed yet.</div>}
      </div>
    </>
  );
}
