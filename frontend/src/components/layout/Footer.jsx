// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import Icon from '../common/Icon.jsx';
import './Footer.css';

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/products', label: 'Products' },
  { to: '/contact', label: 'Contact' },
  { to: '/brands', label: 'Brands' },
];

const CONTACT_INFO = {
  phone: '+885 19 520 629',
  email: 'hello@trendora.com',
  address: 'Russian Federation Blvd (110), Phnom Penh',
};

const SOCIAL_ICONS = {
  TikTok: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.11-.59-1.62-.93-.01 2.92.01 5.84-.02 8.76-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.3-.7.32-1.06.04-1.13.02-2.26.02-3.39 0-3.22.01-6.44.01-9.66z" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  Telegram: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  GitHub: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.3-.535-1.52.117-3.16 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.399 1.02 0 2.04.132 3 .399 2.292-1.552 3.3-1.23 3.3-1.23.653 1.64.24 2.86.118 3.16.768.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.62-5.476 5.92.43.37.824 1.102.824 2.22 0 1.602-.015 2.894-.015 3.287 0 .322.216.694.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
};

const SOCIAL_LINKS = [
  { label: 'TikTok', url: '#', icon: SOCIAL_ICONS.TikTok },
  { label: 'Facebook', url: '#', icon: SOCIAL_ICONS.Facebook },
  { label: 'Telegram', url: '#', icon: SOCIAL_ICONS.Telegram },
  { label: 'GitHub', url: '#', icon: SOCIAL_ICONS.GitHub },
];

function LinkColumn({ title, links }) {
  return (
    <div className="tr-footer__col">
      <h3>{title}</h3>
      <ul>
        {links.map(({ to, label }) => (
          <li key={label}>
            <Link to={to}>{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Payment logos with gap & hover animation ----
const PAYMENT_LOGOS = [
  { name: 'Visa',       url: 'https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/visa.svg' },
  { name: 'Mastercard', url: 'https://inkbotdesign.com/wp-content/uploads/2025/06/mastercard-logo-design-1024x559.webp' },
  { name: 'ABA Bank',   url: 'https://ibccambodia.com/wp-content/uploads/2023/09/ABA-Logo-Secondary.png.webp' },
  { name: 'ACLEDA Bank',url: 'https://www.acledabank.com.kh/kh/assets/layout/logo3.png' },,
  { name: 'Wing Bank',  url: 'https://ibccambodia.com/wp-content/uploads/2019/09/New-WingBank-Logo_Green-2025.png' },
  { name: 'KHQR',       url: 'https://isfcambodia.org/wp-content/uploads/KHQR.svg' },
];

function PaymentLogos() {
  return (
    <div className="tr-footer__pay-logos">
      {PAYMENT_LOGOS.map((logo) => (
        <span key={logo.name} className="tr-footer__pay-logo">
          <img src={logo.url} alt={logo.name} />
        </span>
      ))}
      {/* Embed styles for gap and hover animation */}
      <style>{`
        .tr-footer__pay-logos {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .tr-footer__pay-logo {
          display: inline-flex;
          transition: transform 0.2s ease, opacity 0.2s ease;
          line-height: 0;
        }
        .tr-footer__pay-logo:hover {
          transform: scale(1.1);
          opacity: 0.8;
        }
        .tr-footer__pay-logo img {
          height: 20px;
          width: auto;
          display: block;
          object-fit: contain;
        }
      `}</style>
    </div>
  );
}
// --------------------------------------------------------------

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim() === '') return;
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <footer className="tr-footer" role="contentinfo">
      <div className="tr-footer__newsletter-band">
        <div className="container-trendora tr-footer__newsletter">
          <div className="tr-footer__newsletter-text">
            <span className="tr-footer__mail-icon" aria-hidden="true">
              <Icon name="mail" size={22} />
            </span>
            <div>
              <strong>Subscribe to our newsletter</strong>
              <p>Get updates on new arrivals, exclusive offers and more.</p>
            </div>
          </div>
          <form className="tr-footer__newsletter-form" onSubmit={handleSubmit}>
            <label htmlFor="footer-email" className="visually-hidden">Email address</label>
            <div className="tr-footer__newsletter-field">
              <input
                type="email"
                id="footer-email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
              />
              <button type="submit" className="btn-tan" disabled={submitted}>
                {submitted ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>
            {submitted && (
              <p className="tr-footer__success" role="status">Thanks for subscribing!</p>
            )}
          </form>
        </div>
      </div>

      {/* Main grid */}
      <div className="container-trendora tr-footer__grid">
        <div className="tr-footer__brand">
          <p className="logo-font tr-footer__logo">Trendora</p>
          <p className="tr-footer__tagline">
            Discover style — your ultimate definition for trendy, quality clothing.
          </p>
          <div className="tr-footer__socials">
            {SOCIAL_LINKS.map(({ label, url, icon }) => (
              <a
                key={label}
                href={url}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        <LinkColumn title="Quick Links" links={QUICK_LINKS} />

        <div className="tr-footer__col">
          <h3>Contact Us</h3>
          <address>
            <ul className="tr-footer__contact">
              <li>
                <Icon name="phone" size={16} />
                <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`}>{CONTACT_INFO.phone}</a>
              </li>
              <li>
                <Icon name="mail" size={16} />
                <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>
              </li>
              <li>
                <Icon name="mapPin" size={16} />
                <span>{CONTACT_INFO.address}</span>
              </li>
            </ul>
          </address>
        </div>
      </div>

      <div className="container-trendora tr-footer__bottom">
        <span className="tr-footer__copy">
          &copy; {new Date().getFullYear()} Trendora — for education purposes only.
          <span className="tr-footer__legal-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span aria-hidden="true"> · </span>
            <Link to="/terms">Terms &amp; Conditions</Link>
          </span>
        </span>
        <div className="tr-footer__pay">
          <span>We accept</span>
          <PaymentLogos />
        </div>
        <button
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <Icon name="arrowUp" size={16} /> Top
        </button>
      </div>
    </footer>
  );
}
