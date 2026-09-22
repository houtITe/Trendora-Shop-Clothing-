import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, ApiRequestError } from '../services/api.js';
import './Profile.css';

function Stars({ rating }) {
  return (
    <span className="tr-profile__stars" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? 'is-filled' : ''}>★</span>
      ))}
    </span>
  );
}

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [tab, setTab] = useState('account');
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '', address: user?.address || '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '' });
  const [savedMsg, setSavedMsg] = useState('');
  const [pwStatus, setPwStatus] = useState({ text: '', isError: false });
  const [saving, setSaving] = useState(false);

  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/reviews/mine');
        // Backend already orders these by created_at DESC (see ReviewRepository.findByUser).
        setMyReviews(data.reviews || []);
      } catch (err) {
        toastError('Could not load your reviews.');
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', form);
      await refreshUser();
      setSavedMsg('Profile updated successfully.');
      toastSuccess('Profile updated successfully.');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Failed to update profile.';
      toastError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
      });
      setPasswordForm({ current: '', next: '' });
      setPwStatus({ text: 'Password changed successfully.', isError: false });
      toastSuccess('Password changed successfully.');
      setTimeout(() => setPwStatus({ text: '', isError: false }), 3000);
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Failed to update password.';
      setPwStatus({ text: msg, isError: true });
      toastError(msg);
    }
  }

  const initials = (user?.name || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="page-fade container-trendora tr-profile">
      <div className="tr-profile__hero">
        <div className="tr-profile__avatar">{initials}</div>
        <div>
          <h1>{user?.name || 'User Profile'}</h1>
          <p>{user?.email || ''}</p>
          {user?.role && <span className={`tr-admin__pill tr-admin__pill--${user.role}`}>{user.role}</span>}
        </div>
      </div>

      <div className="tr-profile__tabs">
        <button className={tab === 'account' ? 'is-active' : ''} onClick={() => setTab('account')}>Account Details</button>
        <button className={tab === 'security' ? 'is-active' : ''} onClick={() => setTab('security')}>Security</button>
        <button className={tab === 'reviews' ? 'is-active' : ''} onClick={() => setTab('reviews')}>My Reviews ({myReviews.length})</button>
      </div>

      {tab === 'account' && (
        <form className="tr-profile__card" onSubmit={saveProfile}>
          <h5>Account Details</h5>
          {savedMsg && <div className="tr-profile__success">{savedMsg}</div>}
          <div className="tr-profile__row">
            <div>
              <label>Full Name</label>
              <input className="form-control-trendora" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Email</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--tr-gray)' }}>(Cannot be changed)</span>
              </label>
              <input type="email" className="form-control-trendora" value={form.email} disabled style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }} />
            </div>
          </div>
          <div className="tr-profile__row">
            <div>
              <label>Phone</label>
              <input className="form-control-trendora" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label>Address</label>
              <input className="form-control-trendora" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-dark-pill" style={{ marginTop: 14 }} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      )}

      {tab === 'security' && (
        <form className="tr-profile__card" onSubmit={changePassword}>
          <h5>Change Password</h5>
          {pwStatus.text && (
            <div className={pwStatus.isError ? 'tr-profile__error' : 'tr-profile__success'}>
              {pwStatus.text}
            </div>
          )}
          <div className="tr-profile__row">
            <div>
              <label>Current Password</label>
              <input type="password" className="form-control-trendora" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} required />
            </div>
            <div>
              <label>New Password</label>
              <input type="password" className="form-control-trendora" value={passwordForm.next} onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })} required minLength={8} />
              <small style={{ display: 'block', fontSize: '0.74rem', color: 'var(--tr-gray)', marginTop: 4 }}>
                At least 8 characters, with at least 1 letter and 1 number.
              </small>
            </div>
          </div>
          <button type="submit" className="btn-tan" style={{ marginTop: 14 }}>Update Password</button>

          <hr style={{ margin: '24px 0' }} />
          <button type="button" className="btn-outline-dark-pill" onClick={logout}>Log Out</button>
        </form>
      )}

      {tab === 'reviews' && (
        <div className="tr-profile__card">
          <h5>My Reviews</h5>
          {reviewsLoading ? (
            <p className="tr-profile__empty">Loading…</p>
          ) : myReviews.length === 0 ? (
            <p className="tr-profile__empty">You haven't reviewed any products yet. Reviews you leave on product pages will show up here.</p>
          ) : (
            <div className="tr-profile__reviews">
              {myReviews.map((r) => (
                <div className="tr-profile__review" key={r.review_id}>
                  {r.product_image && <img src={r.product_image} alt={r.product_name} />}
                  <div className="tr-profile__review-body">
                    <div className="tr-profile__review-head">
                      <strong>{r.product_name || 'Product'}</strong>
                      <Stars rating={r.rating} />
                    </div>
                    {!!r.recommend && <span className="tr-profile__recommend-badge">Recommends this product</span>}
                    {r.comment && <p>{r.comment}</p>}
                    {r.photo && <img className="tr-profile__review-photo" src={r.photo} alt="Uploaded by reviewer" />}
                    <small>{new Date(r.created_at).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}