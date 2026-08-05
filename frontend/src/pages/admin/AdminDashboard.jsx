import { NavLink, Outlet } from 'react-router-dom';
import './Admin.css';

const LINKS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Manage Users' },
  { to: '/admin/products', label: 'Manage Products' },
  { to: '/admin/categories', label: 'Manage Categories' },
  { to: '/admin/brands', label: 'Manage Brands' },
  { to: '/admin/orders', label: 'Manage Orders' },
  { to: '/admin/payments', label: 'Manage Payments' },
];
 
export default function AdminDashboard() {
  return (
    <div className="tr-admin page-fade">
      <aside className="tr-admin__sidebar">
        <h4>Admin Panel</h4>
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
