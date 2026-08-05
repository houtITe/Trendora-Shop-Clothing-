import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Icon from '../components/common/Icon.jsx';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const { loadUserCart } = useCart();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message);
        toastError(result.message || 'Incorrect email or password.');
        setIsSubmitting(false);
        return;
      }
      await loadUserCart(result.user.id);
      toastSuccess(`Welcome back, ${result.user.name?.split(' ')[0] || 'there'}!`);
      const roleHome = result.user.role === 'admin' ? '/admin'
                      : result.user.role === 'staff' ? '/staff'
                      : '/';
      const redirectTo = location.state?.from?.pathname || roleHome;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('An unexpected error occurred.');
      toastError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tr-auth tr-auth--login page-fade">
      <div className="tr-auth__card">
        <div className="tr-auth__header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="tr-auth__form">
          {error && (
            <div className="tr-auth__error" role="alert">
              <span>{error}</span>
              <button
                type="button"
                className="tr-auth__error-close"
                onClick={() => setError('')}
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}

          {/* Email field with mail icon */}
          <div className="tr-auth__field">
            <label htmlFor="email">Email Address</label>
            <div className="tr-auth__input-wrapper">
              <span className="tr-auth__input-icon">
                <Icon name="mail" size={20} />   {/* ✅ real icon */}
              </span>
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

          {/* Password field with lock icon */}
          <div className="tr-auth__field">
            <label htmlFor="password">Password</label>
            <div className="tr-auth__input-wrapper">
              <span className="tr-auth__input-icon">
                <Icon name="lock" size={20} />    {/* ✅ real icon */}
              </span>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="tr-auth__meta">
            <label className="tr-auth__remember">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password" className="tr-auth__forgot">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="tr-auth__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="tr-auth__footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
        <Link to="/" className="tr-auth__back">&larr; Back to Home</Link>
        <p className="tr-auth__demo">
          Demo: admin@trendora.com / admin123 &bull; staff@trendora.com / staff123 &bull; customer@trendora.com / customer123
        </p>
      </div>
    </div>
  );
}