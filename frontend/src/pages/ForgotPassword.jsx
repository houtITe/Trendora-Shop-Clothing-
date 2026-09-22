import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiRequestError } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import './Auth.css';

export default function ForgotPassword() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const data = await api.post('/auth/forgot-password', { email: email.trim() });
      if (data?.resetToken) {
        setResetLink(`/reset-password/${data.resetToken}`);
      }
      setSubmitted(true);
      toastSuccess('If an account exists for that email, a reset link is ready below.');
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Could not process password reset.';
      setError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const EmailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );

  return (
    <div className="tr-auth tr-auth--forgot page-fade">
      <div className="tr-auth__card">
        <div className="tr-auth__header">
          <h2>Reset Password</h2>
          <p>Enter your email and we'll get you a link to reset your password.</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="tr-auth__form">
            {error && (
              <div className="tr-auth__error" role="alert">
                <span>{error}</span>
                <button type="button" className="tr-auth__error-close" onClick={() => setError('')} aria-label="Dismiss error">&times;</button>
              </div>
            )}

            <div className="tr-auth__field">
              <label htmlFor="email">Email Address</label>
              <div className="tr-auth__input-wrapper">
                <span className="tr-auth__input-icon"><EmailIcon /></span>
                <input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="tr-auth__submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="tr-auth__success">
            <div className="tr-auth__success-icon">✓</div>
            <h3>Check your link</h3>
            {resetLink ? (
              <>
                <p>An account exists for <strong>{email}</strong>. Since this is a demo without a real email server, here's your reset link directly:</p>
                <Link to={resetLink} className="tr-auth__submit" style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
                  Open Reset Link
                </Link>
              </>
            ) : (
              <p>If an account exists for <strong>{email}</strong>, a reset link has been prepared for it.</p>
            )}
            <button onClick={() => { setSubmitted(false); setResetLink(''); }} className="tr-auth__submit" style={{ marginTop: '1rem' }}>
              Try a different email
            </button>
          </div>
        )}

        <p className="tr-auth__footer">
          <Link to="/login" className="tr-auth__back-link">&larr; Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
