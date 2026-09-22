import { useState } from 'react';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiRequestError } from '../../services/api.js';

const LOW_STOCK_THRESHOLD = 10;

export default function StaffInventory() {
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const { products, loading, reload } = useCatalog();
  const { success: toastSuccess, error: toastError } = useToast();

  async function handleAdjustStock(productId, delta) {
    setUpdatingId(productId);
    try {
      await api.patch(`/products/${productId}/stock`, { delta });
      await reload();
      toastSuccess(`Stock adjusted (${delta > 0 ? `+${delta}` : delta}).`);
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not adjust stock.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCustomAdjust(p) {
    const input = window.prompt(`Adjust stock for "${p.product_name}" (current stock: ${p.stock}):\nEnter delta (e.g. +5 or -3):`, '+1');
    if (!input) return;
    const delta = parseInt(input, 10);
    if (isNaN(delta) || delta === 0) return;
    if (p.stock + delta < 0) {
      toastError('Cannot reduce stock below 0.');
      return;
    }
    handleAdjustStock(p.product_id, delta);
  }

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search);
    const matchesLow = !onlyLow || p.stock <= LOW_STOCK_THRESHOLD;
    return matchesSearch && matchesLow;
  });

  return (
    <>
      <h2>Inventory Management</h2>
      <div className="tr-admin__toolbar">
        <input className="form-control-trendora" placeholder="Search by name, SKU, or barcode" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem' }}>
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} /> Low stock only
        </label>
      </div>

      <div className="tr-admin__table-wrap">
        <table className="tr-admin__table">
          <thead>
            <tr>
              <th></th>
              <th>Product</th>
              <th>SKU</th>
              <th>Barcode</th>
              <th>Size</th>
              <th>Color</th>
              <th>Stock</th>
              <th>Adjust Stock</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.product_id}>
                <td><img src={p.image} alt={p.product_name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} /></td>
                <td><strong>{p.product_name}</strong></td>
                <td>{p.sku}</td>
                <td>{p.barcode}</td>
                <td>{p.size}</td>
                <td>{p.color}</td>
                <td>
                  <span className={`tr-admin__pill ${p.stock <= LOW_STOCK_THRESHOLD ? 'tr-admin__pill--admin' : 'tr-admin__pill--customer'}`}>
                    {p.stock} {p.stock <= LOW_STOCK_THRESHOLD ? '· Low' : ''}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className="btn-outline-dark-pill"
                      style={{ padding: '2px 8px', fontSize: '0.78rem' }}
                      disabled={p.stock <= 0 || updatingId === p.product_id}
                      onClick={() => handleAdjustStock(p.product_id, -1)}
                      title="Decrease by 1"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      className="btn-outline-dark-pill"
                      style={{ padding: '2px 8px', fontSize: '0.78rem' }}
                      disabled={updatingId === p.product_id}
                      onClick={() => handleAdjustStock(p.product_id, 1)}
                      title="Increase by 1"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      className="btn-link"
                      style={{ fontSize: '0.78rem', marginLeft: 4 }}
                      disabled={updatingId === p.product_id}
                      onClick={() => handleCustomAdjust(p)}
                    >
                      Custom…
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="tr-admin__empty">Loading inventory…</div>}
        {!loading && filtered.length === 0 && <div className="tr-admin__empty">No products found.</div>}
      </div>
    </>
  );
}
