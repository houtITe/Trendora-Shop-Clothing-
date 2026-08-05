import { useState } from 'react';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiRequestError } from '../../services/api.js';
import Modal from '../../components/common/Modal.jsx';

const EMPTY = { category_name: '' };

export default function ManageCategories() {
  const { categories, products, reload } = useCatalog();
  const { success: toastSuccess, error: toastError } = useToast();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  function openAdd() { setForm(EMPTY); setAdding(true); }
  function openEdit(c) { setForm({ category_name: c.category_name }); setEditing(c.category_id); }
  function closeModal() { setAdding(false); setEditing(null); }

  async function submitAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/categories', form);
      await reload();
      toastSuccess('Category added successfully.');
      closeModal();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not add category.');
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/categories/${editing}`, form);
      await reload();
      toastSuccess('Category updated successfully.');
      closeModal();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not update category.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const inUse = products.some((p) => p.category_id === id);
    if (inUse) { toastError('Cannot delete: products are still assigned to this category.'); return; }
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      await reload();
      toastSuccess('Category deleted.');
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not delete category.');
    }
  }

  return (
    <>
      <h2>Manage Categories</h2>
      <div className="tr-admin__toolbar">
        <span style={{ color: 'var(--tr-gray)' }}>{categories.length} categories</span>
        <button className="btn-tan" onClick={openAdd}>+ Add Category</button>
      </div>

      <div className="tr-admin__table-wrap">
        <table className="tr-admin__table">
          <thead><tr><th>ID</th><th>Category Name</th><th>Products</th><th>Actions</th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.category_id}>
                <td>{c.category_id}</td>
                <td>{c.category_name}</td>
                <td>{products.filter((p) => p.category_id === c.category_id).length}</td>
                <td className="tr-admin__actions-cell">
                  <button onClick={() => openEdit(c)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(c.category_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(adding || editing !== null) && (
        <Modal title={adding ? 'Add Category' : 'Edit Category'} onClose={closeModal}>
          <form onSubmit={adding ? submitAdd : submitEdit}>
            <label>Category Name</label>
            <input className="form-control-trendora" value={form.category_name} onChange={(e) => setForm({ category_name: e.target.value })} required />
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
