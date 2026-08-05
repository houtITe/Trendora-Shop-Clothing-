import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserTable } from '../services/db.js';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      toastError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      toastError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const user = UserTable.all().find(
      (u) => u.resetToken === token && u.resetTokenExpiry && u.resetTokenExpiry > Date.now()
    );

    if (!user) {
      setError('This reset link is invalid or has expired. Please request a new one.');
      toastError('This reset link is invalid or has expired.');
      setLoading(false);
      return;
    }

    UserTable.update(user.user_id, { password, resetToken: null, resetTokenExpiry: null });
    setMessage('Password reset successful! Redirecting to login...');
    toastSuccess('Password reset successful! Please sign in with your new password.');
    setLoading(false);
    setTimeout(() => navigate('/login'), 2000);
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
