import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, ApiRequestError } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import './Auth.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      toastError('Passwords do not match.');
      return;
    }
    if (password.length < 8 || !/\d/.test(password) || !/[A-Za-z]/.test(password)) {
      const msg = 'Password must be at least 8 characters long and contain at least one letter and one number.';
      setError(msg);
      toastError(msg);
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setMessage('Password reset successful! Redirecting to login...');
      toastSuccess('Password reset successful! Please sign in with your new password.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'This reset link is invalid or has expired. Please request a new one.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tr-auth page-fade">
      <div className="tr-auth__card">
        <div className="tr-auth__header">
          <h2>Set New Password</h2>
          <p>Enter your new password below.</p>
        </div>
        <form onSubmit={handleSubmit} className="tr-auth__form">
          {error && <div className="tr-auth__error">{error}</div>}
          {message && <div className="tr-auth__success" style={{ color: '#22c55e' }}>{message}</div>}
          <div className="tr-auth__field">
            <label>New Password</label>
            <div className="tr-auth__input-wrapper">
              <span className="tr-auth__input-icon">🔒</span>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="tr-auth__field">
            <label>Confirm Password</label>
            <div className="tr-auth__input-wrapper">
              <span className="tr-auth__input-icon">✓</span>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="tr-auth__submit" disabled={loading}>
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
        <p className="tr-auth__footer">
          <Link to="/login" className="tr-auth__back-link">&larr; Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
