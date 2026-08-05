import { useState } from 'react';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiRequestError } from '../../services/api.js';
import Modal from '../../components/common/Modal.jsx';
import './ManageProducts.css';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '32', '34', '36'];
const ALL_COLORS = ['Black', 'White', 'Gray', 'Beige', 'Navy', 'Brown', 'Blue', 'Cream'];

// A tiny inline SVG so a missing/broken product image never causes a
// broken-image icon (or a repeat-failing 404 to a file that doesn't exist).
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50" fill="#f1f1f1"/><text x="50%" y="55%" font-size="9" text-anchor="middle" fill="#999" font-family="Arial">No Image</text></svg>'
  );

// Note: the real `products` table has a single `size` VARCHAR(20) and a
// single `color` VARCHAR(30) column each (see backend/src/db/schema.sql) —
// not arrays — so this form uses single-select dropdowns, unlike the old
// mock-data version which let you multi-check several sizes/colors at once.
const EMPTY = {
  product_name: '',
  price: '',
  discount: 0,
  stock: '',
  size: ALL_SIZES[0],
  color: ALL_COLORS[0],
  material: '',
  description: '',
  sku: '',
  barcode: '',
  category_id: '',
  brand_id: '',
};

export default function ManageProducts() {
  const { products, categories, brands, loading, reload } = useCatalog();
  const { success: toastSuccess, error: toastError } = useToast();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setForm({
      ...EMPTY,
      category_id: categories[0]?.category_id ?? '',
      brand_id: brands[0]?.brand_id ?? '',
    });
    setImageFile(null);
    setPreviewUrl(null);
    setAdding(true);
  }

  function openEdit(p) {
    setForm({
      product_name: p.product_name,
      price: p.price,
      discount: p.discount,
      stock: p.stock,
      size: p.size || ALL_SIZES[0],
      color: p.color || ALL_COLORS[0],
      material: p.material || '',
      description: p.description || '',
      sku: p.sku || '',
      barcode: p.barcode || '',
      category_id: p.category_id,
      brand_id: p.brand_id,
    });
    setImageFile(null);
    setPreviewUrl(p.image || null);
    setEditing(p.product_id);
  }

  function closeModal() {
    setAdding(false);
    setEditing(null);
    setImageFile(null);
    setPreviewUrl(null);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  // Builds a multipart FormData (not JSON) because the backend's product
  // create/update routes go through multer (see
  // backend/src/middleware/uploadMiddleware.js) so the image file can be
  // saved to disk under /uploads/products.
  function buildFormData() {
    const fd = new FormData();
    fd.append('product_name', form.product_name);
    fd.append('price', form.price);
    fd.append('discount', form.discount || 0);
    fd.append('stock', form.stock);
    fd.append('size', form.size);
    fd.append('color', form.color);
    fd.append('material', form.material);
    fd.append('description', form.description);
    fd.append('sku', form.sku);
    fd.append('barcode', form.barcode);
    fd.append('category_id', form.category_id);
    fd.append('brand_id', form.brand_id);
    if (imageFile) fd.append('image', imageFile);
    return fd;
  }

  async function submitAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.postForm('/products', buildFormData());
      await reload();
      toastSuccess('Product added successfully.');
      closeModal();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not add product.');
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.putForm(`/products/${editing}`, buildFormData());
      await reload();
      toastSuccess('Product updated successfully.');
      closeModal();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not update product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      await reload();
      toastSuccess('Product deleted.');
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not delete product.');
    }
  }

  const filtered = products.filter((p) =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <h2>Manage Products</h2>
      <div className="tr-admin__toolbar">
        <input
          className="form-control-trendora"
          placeholder="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-tan" onClick={openAdd}>
          + Add Product
        </button>
      </div>

      {loading ? (
        <div className="tr-admin__empty">Loading products…</div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th className="col-image">Image</th>
                <th className="col-name">Name</th>
                <th className="col-price">Price</th>
                <th className="col-discount">Disc.</th>
                <th className="col-stock">Stock</th>
                <th className="col-category">Category</th>
                <th className="col-brand">Brand</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.product_id}>
                  <td className="col-image">
                    <img
                      src={p.image || PLACEHOLDER_IMG}
                      alt={p.product_name}
                      className="product-thumbnail"
                      onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMG; }}
                    />
                  </td>
                  <td className="col-name">{p.product_name}</td>
                  <td className="col-price">${p.price.toFixed(2)}</td>
                  <td className="col-discount">{p.discount}%</td>
                  <td className="col-stock">{p.stock}</td>
                  <td className="col-category">
                    {categories.find((c) => c.category_id === p.category_id)?.category_name ?? '—'}
                  </td>
                  <td className="col-brand">
                    {brands.find((b) => b.brand_id === p.brand_id)?.brand_name ?? '—'}
                  </td>
                  <td className="col-actions">
                    <button onClick={() => openEdit(p)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(p.product_id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="tr-admin__empty">No products found.</div>}
        </div>
      )}

      {(adding || editing !== null) && (
        <Modal title={adding ? 'Add Product' : 'Edit Product'} onClose={closeModal}>
          <form onSubmit={adding ? submitAdd : submitEdit}>
            <label>Product Name</label>
            <input
              className="form-control-trendora"
              value={form.product_name}
              onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              required
            />

            <label>Product Image</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="form-control-trendora" />
            {previewUrl && (
              <div style={{ marginTop: 8 }}>
                <img src={previewUrl} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 4 }} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label>Price ($)</label>
                <input type="number" step="0.01" className="form-control-trendora" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div>
                <label>Discount (%)</label>
                <input type="number" className="form-control-trendora" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label>Stock</label>
                <input type="number" className="form-control-trendora" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              </div>
              <div>
                <label>Material</label>
                <input className="form-control-trendora" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label>SKU</label>
                <input className="form-control-trendora" placeholder="e.g. TR-0016" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div>
                <label>Barcode</label>
                <input className="form-control-trendora" placeholder="Scanned/typed by staff in POS" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label>Size</label>
                <select className="form-control-trendora" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                  {ALL_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label>Color</label>
                <select className="form-control-trendora" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                  {ALL_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <label style={{ marginTop: 14 }}>Description</label>
            <textarea
              className="form-control-trendora"
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label>Category</label>
                <select className="form-control-trendora" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Brand</label>
                <select className="form-control-trendora" value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                  {brands.map((b) => (
                    <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="tr-modal__actions">
              <button type="submit" className="btn-dark-pill" disabled={saving}>
                {saving ? 'Saving...' : adding ? 'Add Product' : 'Save Changes'}
              </button>
              <button type="button" className="btn-outline-dark-pill" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
