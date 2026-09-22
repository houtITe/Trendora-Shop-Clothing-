import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiRequestError } from '../../services/api.js';
import Modal from '../../components/common/Modal.jsx';

const EMPTY = {
  zone_name: '',
  min_distance_km: 0,
  max_distance_km: '',
  rate: '',
  estimated_delivery: '',
  is_active: true,
};

export default function ManageShipping() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function loadZones() {
    setLoading(true);
    try {
      const data = await api.get('/shipping-zones/admin');
      setZones(data.zones || []);
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not load shipping zones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadZones();
  }, []);

  function openAdd() {
    setForm(EMPTY);
    setAdding(true);
  }

  function openEdit(zone) {
    setForm({
      zone_name: zone.zone_name,
      min_distance_km: zone.min_distance_km,
      max_distance_km: zone.max_distance_km !== null ? zone.max_distance_km : '',
      rate: zone.rate,
      estimated_delivery: zone.estimated_delivery || '',
      is_active: zone.is_active,
    });
    setEditing(zone.zone_id);
  }

  function closeModal() {
    setAdding(false);
    setEditing(null);
  }

  async function submitAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/shipping-zones', form);
      await loadZones();
      toastSuccess('Shipping distance tier added successfully.');
      closeModal();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not create shipping zone.');
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/shipping-zones/${editing}`, form);
      await loadZones();
      toastSuccess('Delivery rate updated successfully.');
      closeModal();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not update delivery rate.');
    } finally {
      setSaving(false);
    }
  }

  async function removeZone(zoneId) {
    if (!window.confirm('Are you sure you want to delete this delivery zone?')) return;
    try {
      await api.delete(`/shipping-zones/${zoneId}`);
      await loadZones();
      toastSuccess('Delivery zone deleted.');
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not delete delivery zone.');
    }
  }

  async function toggleActive(zone) {
    try {
      await api.put(`/shipping-zones/${zone.zone_id}`, { is_active: !zone.is_active });
      await loadZones();
      toastSuccess(`Zone ${zone.is_active ? 'deactivated' : 'activated'}.`);
    } catch (err) {
      toastError('Could not update status.');
    }
  }

  return (
    <>
      <div className="tr-admin__header">
        <div>
          <h2>Shipping & Delivery Zones</h2>
          <p style={{ color: 'var(--tr-gray)', margin: 0 }}>
            Configure distance-based shipping fees and estimated delivery times for shopping checkout.
          </p>
        </div>
        <button className="btn-dark-pill" onClick={openAdd}>
          + Add Distance Zone
        </button>
      </div>

      <div className="tr-admin__table-card">
        {loading ? (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--tr-gray)' }}>Loading delivery zones...</p>
        ) : zones.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--tr-gray)' }}>No shipping zones configured yet.</p>
        ) : (
          <table className="tr-admin__table">
            <thead>
              <tr>
                <th>Zone / Distance Name</th>
                <th>Distance Range</th>
                <th>Delivery Fee ($)</th>
                <th>Estimated Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.zone_id}>
                  <td>
                    <strong>{z.zone_name}</strong>
                  </td>
                  <td>
                    {z.min_distance_km} km {z.max_distance_km !== null ? `– ${z.max_distance_km} km` : '+ (and above)'}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--tr-dark)', fontSize: '15px' }}>
                      ${Number(z.rate).toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    <span style={{ color: 'var(--tr-gray)' }}>{z.estimated_delivery || 'Standard Delivery'}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleActive(z)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: z.is_active ? '#e6f4ea' : '#fce8e6',
                        color: z.is_active ? '#137333' : '#c5221f',
                      }}
                      title="Click to toggle active"
                    >
                      {z.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div className="tr-admin__actions">
                      <button className="btn-link" onClick={() => openEdit(z)}>
                        Edit Rate
                      </button>
                      <button className="btn-link text-danger" onClick={() => removeZone(z.zone_id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(adding || editing) && (
        <Modal title={adding ? 'Add Distance-Based Shipping Tier' : 'Edit Delivery Rate'} onClose={closeModal}>
          <form onSubmit={adding ? submitAdd : submitEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Zone / Distance Name *
              </label>
              <input
                className="form-control-trendora"
                required
                placeholder="e.g. Inner City (0 - 5 km)"
                value={form.zone_name}
                onChange={(e) => setForm({ ...form, zone_name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Min Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-control-trendora"
                  placeholder="0"
                  value={form.min_distance_km}
                  onChange={(e) => setForm({ ...form, min_distance_km: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Max Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-control-trendora"
                  placeholder="Leave empty for 30+ km"
                  value={form.max_distance_km}
                  onChange={(e) => setForm({ ...form, max_distance_km: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Delivery Fee ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="form-control-trendora"
                  placeholder="e.g. 1.50"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Estimated Delivery Time
                </label>
                <input
                  className="form-control-trendora"
                  placeholder="e.g. Same Day (1-3 hrs)"
                  value={form.estimated_delivery}
                  onChange={(e) => setForm({ ...form, estimated_delivery: e.target.value })}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Active (Shoppers can select this zone during checkout)</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn-outline-dark-pill" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn-dark-pill" disabled={saving}>
                {saving ? 'Saving…' : adding ? 'Create Zone' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
