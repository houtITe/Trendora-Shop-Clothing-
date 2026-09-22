import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import './Admin.css';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: 'grid', end: true },
  { to: '/admin/users', label: 'Manage Users', icon: 'users' },
  { to: '/admin/products', label: 'Manage Products', icon: 'package' },
  { to: '/admin/categories', label: 'Manage Categories', icon: 'tag' },
  { to: '/admin/brands', label: 'Manage Brands', icon: 'award' },
  { to: '/admin/orders', label: 'Manage Orders', icon: 'clock' },
  { to: '/admin/payments', label: 'Manage Payments', icon: 'cart' },
  { to: '/admin/shipping', label: 'Shipping & Delivery', icon: 'truck' },
];
 
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentLink = LINKS.find((l) =>
    l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)
  ) || LINKS[0];

  return (
    <div className="tr-admin page-fade">
      {/* Mobile Sub-Header with Hamburger button */}
      <div className="tr-admin-mobile-header">
        <button
          className="tr-admin-hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Admin Menu"
        >
          <Icon name="menu" size={20} />
          <span>Menu</span>
        </button>
        <span className="tr-admin-mobile-title">{currentLink.label}</span>
        <span className="tr-admin__pill tr-admin__pill--admin">Admin</span>
      </div>

      {/* Backdrop overlay on mobile */}
      <div
        className={`tr-admin-backdrop ${sidebarOpen ? 'is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar: sticky on desktop, slide-out drawer on mobile */}
      <aside className={`tr-admin__sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="tr-admin__sidebar-header">
          <h4>Admin Panel</h4>
          <button
            className="tr-admin__sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="tr-admin__sidebar-nav">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon name={l.icon} size={18} />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="tr-admin__content">
        <Outlet />
      </div>
    </div>
  );
}

