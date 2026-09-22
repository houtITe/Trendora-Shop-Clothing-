import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import Icon from '../common/Icon.jsx';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/products', label: 'Category', icon: 'grid' },
  { to: '/brands', label: 'Brands', icon: 'tag' },
  { to: '/about', label: 'About', icon: 'info' },
  { to: '/contact', label: 'Contact', icon: 'mail' },
];

export default function Navbar() {
  const { isAuthenticated, isAdmin, isStaff, user, logout } = useAuth();
  const { itemCount } = useCart();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isCategoryPage = location.pathname === '/products' || location.pathname === '/brands';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/products?search=${encodeURIComponent(query.trim())}` : '/products');
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  // Safely get the user's first name
  const firstName = user?.name?.split(' ')[0] || user?.firstName || 'User';
  const fullName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';

  return (
    <header className={`tr-navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container-trendora tr-navbar__inner">
        <Link to="/" className="tr-navbar__logo logo-font">Trendora</Link>

        <nav className="tr-navbar__links" aria-label="Main">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="tr-navbar__actions">
          {isCategoryPage && (
            <form className="tr-navbar__search" onSubmit={handleSearch} role="search">
              <Icon name="search" size={17} />
              <label htmlFor="nav-search" className="visually-hidden">Search products</label>
              <input
                id="nav-search"
                type="search"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="tr-navbar__search-btn">Search</button>
            </form>
          )}

          <Link to="/cart" className="tr-navbar__icon" aria-label={`Cart, ${itemCount} items`}>
            <Icon name="cart" />
            {itemCount > 0 && <span className="tr-navbar__badge">{itemCount}</span>}
          </Link>

          <div className="tr-navbar__account">
            <Link
              to={isAuthenticated ? '/profile' : '/login'}
              className="tr-navbar__icon"
              aria-label={isAuthenticated ? 'Your account' : 'Sign in'}
            >
              <Icon name="user" />
            </Link>
            {isAuthenticated && (
              <div className="tr-navbar__dropdown" role="menu">
                <span className="tr-navbar__dropdown-head">Hi, {firstName}</span>
                <Link to="/profile"><Icon name="user" size={16} /> Profile</Link>
                <Link to="/orders"><Icon name="package" size={16} /> Order History</Link>
                {isAdmin && <Link to="/admin"><Icon name="grid" size={16} /> Admin Dashboard</Link>}
                {isStaff && <Link to="/staff"><Icon name="grid" size={16} /> Staff Panel</Link>}
                <button onClick={handleLogout} className="tr-navbar__logout">
                  <Icon name="logout" size={16} /> Logout
                </button>
              </div>
            )}
          </div>

          <button
            className="tr-navbar__burger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      <div
        className={`tr-navbar__overlay ${menuOpen ? 'is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <div className={`tr-navbar__mobile ${menuOpen ? 'is-open' : ''}`}>
        <div className="tr-navbar__mobile-header">
          <button
            className="tr-navbar__mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="close" size={24} />
          </button>
          {isAuthenticated ? (
            <div className="tr-navbar__mobile-user">
              <div className="tr-navbar__mobile-avatar">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="tr-navbar__mobile-greeting">Welcome back</p>
                <p className="tr-navbar__mobile-name">{fullName}</p>
              </div>
            </div>
          ) : (
            <Link to="/login" className="tr-navbar__mobile-login-btn" onClick={() => setMenuOpen(false)}>
              <Icon name="logIn" size={18} /> Sign In
            </Link>
          )}
        </div>

        {isCategoryPage && (
          <form className="tr-navbar__search tr-navbar__search--mobile" onSubmit={handleSearch} role="search">
            <Icon name="search" size={17} />
            <label htmlFor="mobile-search" className="visually-hidden">Search products</label>
            <input
              id="mobile-search"
              type="search"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="tr-navbar__search-btn">Search</button>
          </form>
        )}

        <nav className="tr-navbar__mobile-nav">
          <div className="tr-navbar__mobile-section-label">Browse</div>
          {NAV_LINKS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'is-active' : '')}
              onClick={() => setMenuOpen(false)}
            >
              <span>
                <Icon name={icon} size={18} />
                {label}
              </span>
            </NavLink>
          ))}

          {isAuthenticated && (
            <>
              <div className="tr-navbar__mobile-section-label">Account</div>
              <NavLink
                to="/profile"
                className={({ isActive }) => (isActive ? 'is-active' : '')}
                onClick={() => setMenuOpen(false)}
              >
                <span>
                  <Icon name="user" size={18} />
                  My Profile
                </span>
              </NavLink>
              <NavLink
                to="/orders"
                className={({ isActive }) => (isActive ? 'is-active' : '')}
                onClick={() => setMenuOpen(false)}
              >
                <span>
                  <Icon name="package" size={18} />
                  My Orders
                </span>
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <div className="tr-navbar__mobile-section-label">Administration</div>
              <NavLink
                to="/admin"
                className={({ isActive }) => (isActive ? 'is-active' : '')}
                onClick={() => setMenuOpen(false)}
              >
                <span>
                  <Icon name="grid" size={18} />
                  Admin Dashboard
                </span>
              </NavLink>
            </>
          )}

          {isStaff && (
            <>
              <div className="tr-navbar__mobile-section-label">Staff Portal</div>
              <NavLink
                to="/staff"
                end
                className={({ isActive }) => (isActive ? 'is-active' : '')}
                onClick={() => setMenuOpen(false)}
              >
                <span>
                  <Icon name="grid" size={18} />
                  Staff Dashboard
                </span>
              </NavLink>
              <NavLink
                to="/staff/pos"
                className={({ isActive }) => (isActive ? 'is-active' : '')}
                onClick={() => setMenuOpen(false)}
              >
                <span>
                  <Icon name="cart" size={18} />
                  POS Terminal
                </span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="tr-navbar__mobile-footer">
          <Link to="/cart" className="tr-navbar__mobile-cart" onClick={() => setMenuOpen(false)}>
            <Icon name="cart" size={20} />
            <span>Cart {itemCount > 0 && `(${itemCount})`}</span>
          </Link>
          {isAuthenticated ? (
            <button onClick={handleLogout} className="tr-navbar__logout--mobile">
              <Icon name="logout" size={18} /> Logout
            </button>
          ) : (
            <Link to="/register" className="tr-navbar__mobile-register" onClick={() => setMenuOpen(false)}>
              <Icon name="userPlus" size={18} /> Create Account
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}