import { NavLink, Outlet } from 'react-router-dom';
import '../admin/Admin.css';
import './Staff.css';

const LINKS = [
  { to: '/staff', label: 'Dashboard', end: true },
  { to: '/staff/pos', label: 'POS' },
  { to: '/staff/orders', label: 'Orders' },
  { to: '/staff/returns', label: 'Returns' },
  { to: '/staff/customers', label: 'Customers' },
  { to: '/staff/inventory', label: 'Inventory' },
  { to: '/staff/profile', label: 'Profile' },
  { to: '/staff/settings', label: 'Settings' },
];

export default function StaffDashboard() {
  return (
    <div className="tr-admin page-fade">
      <aside className="tr-admin__sidebar">
        <h4>Staff Panel</h4>
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {l.label}
          </NavLink>
        ))}
      </aside>
      <div className="tr-admin__content">
        <Outlet />
      </div>
    </div>
  );
}
