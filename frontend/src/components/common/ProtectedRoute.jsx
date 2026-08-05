import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Guards routes that require a logged-in user, optionally restricted to
 * specific roles.
 *
 *   <ProtectedRoute><Profile /></ProtectedRoute>                 → any logged-in user
 *   <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute> → admin only (legacy prop, kept for compatibility)
 *   <ProtectedRoute roles={['staff','admin']}><POS /></ProtectedRoute> → staff or admin (Admin has full access everywhere)
 */
export default function ProtectedRoute({ children, adminOnly = false, roles = null }) {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();
  const location = useLocation();

  // Still waiting on the initial GET /auth/me check (e.g. right after a
  // page refresh) — don't redirect yet, or a logged-in user with a valid
  // cookie gets briefly bounced to /login before the check resolves.
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (roles && !isAdmin && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
