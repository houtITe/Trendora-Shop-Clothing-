import { useState } from 'react';
import { useCatalog } from '../../context/CatalogContext.jsx';

const LOW_STOCK_THRESHOLD = 10;

export default function StaffInventory() {
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const { products, loading } = useCatalog();

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
      <h2>Inventory <span style={{ fontSize: '.7rem', color: 'var(--tr-gray)', fontWeight: 500 }}>(view only)</span></h2>
      <div className="tr-admin__toolbar">
        <input className="form-control-trendora" placeholder="Search by name, SKU, or barcode" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem' }}>
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} /> Low stock only
        </label>
      </div>

      <div className="tr-admin__table-wrap">
        <table className="tr-admin__table">
          <thead><tr><th></th><th>Product</th><th>SKU</th><th>Barcode</th><th>Size</th><th>Color</th><th>Stock</th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.product_id}>
                <td><img src={p.image} alt={p.product_name} /></td>
                <td>{p.product_name}</td>
                <td>{p.sku}</td>
                <td>{p.barcode}</td>
                <td>{p.size}</td>
                <td>{p.color}</td>
                <td>
                  <span className={`tr-admin__pill ${p.stock <= LOW_STOCK_THRESHOLD ? 'tr-admin__pill--admin' : 'tr-admin__pill--customer'}`}>
                    {p.stock} {p.stock <= LOW_STOCK_THRESHOLD ? '· Low' : ''}
                  </span>
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
