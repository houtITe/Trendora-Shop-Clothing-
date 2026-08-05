import { useState } from 'react';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiRequestError } from '../../services/api.js';
import Modal from '../../components/common/Modal.jsx';

// Note: the real `brands` table only has brand_id + brand_name (see
// backend/src/db/schema.sql) — there's no logo_url column, so that field
// from the old mock-data form has been dropped here.
const EMPTY = { brand_name: '' };

export default function ManageBrands() {
  const { brands, products, reload } = useCatalog();
  const { success: toastSuccess, error: toastError } = useToast();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  function openAdd() { setForm(EMPTY); setAdding(true); }
  function openEdit(b) { setForm({ brand_name: b.brand_name }); setEditing(b.brand_id); }
  function closeModal() { setAdding(false); setEditing(null); }

  async function submitAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/brands', form);
      await reload();
      toastSuccess('Brand added successfully.');
      closeModal();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not add brand.');
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/brands/${editing}`, form);
      await reload();
      toastSuccess('Brand updated successfully.');
      closeModal();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not update brand.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const inUse = products.some((p) => p.brand_id === id);
    if (inUse) { toastError('Cannot delete: products are still assigned to this brand.'); return; }
    if (!confirm('Delete this brand?')) return;
    try {
      await api.delete(`/brands/${id}`);
      await reload();
      toastSuccess('Brand deleted.');
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not delete brand.');
    }
  }

  return (
    <>
      <h2>Manage Brands</h2>
      <div className="tr-admin__toolbar">
        <span style={{ color: 'var(--tr-gray)' }}>{brands.length} brands</span>
        <button className="btn-tan" onClick={openAdd}>+ Add Brand</button>
      </div>

      <div className="tr-admin__table-wrap">
        <table className="tr-admin__table">
          <thead><tr><th>ID</th><th>Brand Name</th><th>Products</th><th>Actions</th></tr></thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.brand_id}>
                <td>{b.brand_id}</td>
                <td>{b.brand_name}</td>
                <td>{products.filter((p) => p.brand_id === b.brand_id).length}</td>
                <td className="tr-admin__actions-cell">
                  <button onClick={() => openEdit(b)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(b.brand_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(adding || editing !== null) && (
        <Modal title={adding ? 'Add Brand' : 'Edit Brand'} onClose={closeModal}>
          <form onSubmit={adding ? submitAdd : submitEdit}>
            <label>Brand Name</label>
            <input className="form-control-trendora" value={form.brand_name} onChange={(e) => setForm({ brand_name: e.target.value })} required />
            <div className="tr-modal__actions">
              <button type="submit" className="btn-dark-pill" disabled={saving}>{saving ? 'Saving...' : adding ? 'Add' : 'Save Changes'}</button>
              <button type="button" className="btn-outline-dark-pill" onClick={closeModal}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
