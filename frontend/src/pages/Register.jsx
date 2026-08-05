import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Icon from '../components/common/Icon.jsx';
import './Auth.css';

export default function Register() {
  const { register } = useAuth(); // expects (firstName, lastName, email, password)
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      toastError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Pass firstName, lastName, email, password to your register function
      const result = await register(form.firstName, form.lastName, form.email, form.password);
      if (!result.success) {
        setError(result.message);
        toastError(result.message || 'Could not create account.');
        setIsSubmitting(false);
        return;
      }
      toastSuccess('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError('An unexpected error occurred.');
      toastError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tr-auth tr-auth--register page-fade">
      <div className="tr-auth__card">
        <div className="tr-auth__header">
          <h2>Create Account</h2>
          <p>Join Trendora and start your style journey</p>
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

          
          <div className="tr-auth__field">
            <label htmlFor="firstName">Full Name</label>
            <div className="tr-auth__input-wrapper">
              <span className="tr-auth__input-icon">
                <Icon name="user" size={20} />
              </span>
              <input
                type="text"
                id="firstName"
                className="form-control-trendora"
                placeholder="John"
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="tr-auth__field">
            <label htmlFor="lastName">Last Name</label>
            <div className="tr-auth__input-wrapper">
              <span className="tr-auth__input-icon">
                <Icon name="user" size={20} />
              </span>
              <input
                type="text"
                id="lastName"
                className="form-control-trendora"
                placeholder="Doe"
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="tr-auth__field">
            <label htmlFor="email">Email Address</label>
            <div className="tr-auth__input-wrapper">
              <span className="tr-auth__input-icon">
                <Icon name="mail" size={20} />
              </span>
              <input
                type="email"
                id="email"
                className="form-control-trendora"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="tr-auth__field">
            <label htmlFor="password">Password</label>
            <div className="tr-auth__input-wrapper">
              <span className="tr-auth__input-icon">
                <Icon name="lock" size={20} />
              </span>
              <input
                type="password"
                id="password"
                className="form-control-trendora"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="tr-auth__field">
            <label htmlFor="confirm">Confirm Password</label>
            <div className="tr-auth__input-wrapper">
              <span className="tr-auth__input-icon">
                <Icon name="lock" size={20} />
              </span>
              <input
                type="password"
                id="confirm"
                className="form-control-trendora"
                placeholder="Confirm your password"
                value={form.confirm}
                onChange={(e) => update('confirm', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="tr-auth__terms">
            <label>
              <input type="checkbox" required /> I agree to the{' '}
              <Link to="/terms">Terms & Conditions</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>
            </label>
          </div>

          <button type="submit" className="tr-auth__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="tr-auth__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <Link to="/" className="tr-auth__back">&larr; Back to Home</Link>
      </div>
    </div>
  );
}