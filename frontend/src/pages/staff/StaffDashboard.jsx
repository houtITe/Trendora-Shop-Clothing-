import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import '../admin/Admin.css';
import './Staff.css';

const LINKS = [
  { to: '/staff', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/staff/pos', label: 'POS', icon: 'cart' },
  { to: '/staff/orders', label: 'Orders', icon: 'clock' },
  { to: '/staff/returns', label: 'Returns', icon: 'refresh' },
  { to: '/staff/customers', label: 'Customers', icon: 'users' },
  { to: '/staff/inventory', label: 'Inventory', icon: 'package' },
  { to: '/staff/profile', label: 'Profile', icon: 'user' },
  { to: '/staff/settings', label: 'Settings', icon: 'sliders' },
];

export default function StaffDashboard() {
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
          aria-label="Open Staff Menu"
        >
          <Icon name="menu" size={20} />
          <span>Menu</span>
        </button>
        <span className="tr-admin-mobile-title">{currentLink.label}</span>
        <span className="tr-admin__pill tr-admin__pill--staff">Staff</span>
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
          <h4>Staff Panel</h4>
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

