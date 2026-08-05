/**
 * Brand + payment logo marks.
 * Real logos are loaded from the Simple Icons CDN (official brand marks),
 * with a graceful text-wordmark fallback so nothing ever renders broken.
 * Data-driven so it can be fed from an API/database later.
 */
import { useState } from 'react';
import './Logos.css';

export const FASHION_BRANDS = [
  { slug: 'nike', name: 'Nike' },
  { slug: 'adidas', name: 'Adidas' },
  { slug: 'zara', name: 'Zara' },
  { slug: 'hm', name: 'H&M' },
  { slug: 'puma', name: 'Puma' },
  { slug: 'uniqlo', name: 'Uniqlo' },
  { slug: 'levis', name: "Levi's" },
  { slug: 'newbalance', name: 'New Balance' },
  { slug: 'underarmour', name: 'Under Armour' },
  { slug: 'converse', name: 'Converse' },
  { slug: 'gucci', name: 'Gucci' },
  { slug: 'lacoste', name: 'Lacoste' },
];

export const PAYMENT_LOGOS = [
  { slug: 'visa', name: 'Visa' },
  { slug: 'mastercard', name: 'Mastercard' },
  // Cambodia-specific rails — not on Simple Icons, use the custom badges below
  { slug: 'khqr', name: 'KHQR' },
  { slug: 'aba', name: 'ABA Bank' },
  { slug: 'acleda', name: 'ACLEDA Bank' },
  { slug: 'wing', name: 'Wing Bank' },
];

/** Map an arbitrary brand name (e.g. from the database) to a logo slug. */
export function slugForBrand(name = '') {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = { handm: 'hm', hm: 'hm', levis: 'levis', levistrauss: 'levis' };
  return aliases[key] || key;
}

const CUSTOM_BADGES = {
  khqr: { bg: '#1A1A2E', fg: '#fff', label: 'KHQR' },
  aba: { bg: '#1C1C7A', fg: '#F7C144', label: 'ABA' },
  acleda: { bg: '#00539F', fg: '#fff', label: 'ACLEDA' },
  wing: { bg: '#E4002B', fg: '#fff', label: 'Wing' },
};

function CustomBadge({ slug, height }) {
  const badge = CUSTOM_BADGES[slug];
  const width = height * 2.1;
  return (
    <svg viewBox="0 0 84 32" width={width} height={height} xmlns="http://www.w3.org/2000/svg" aria-label={badge.label}>
      <rect width="84" height="32" rx="6" fill={badge.bg} />
      {slug === 'khqr' ? (
        <>
          <rect x="8" y="7" width="7" height="7" rx="1" fill="#F4A261" />
          <rect x="17" y="7" width="7" height="7" rx="1" fill="#F4A261" />
          <rect x="8" y="16" width="7" height="7" rx="1" fill="#F4A261" />
          <text x="28" y="21" fontSize="11" fontWeight="700" fill={badge.fg} fontFamily="Arial, sans-serif">KHQR</text>
        </>
      ) : (
        <text x="42" y="20" fontSize="12" fontWeight="700" fill={badge.fg} fontFamily="Arial, sans-serif" textAnchor="middle" letterSpacing="0.5">
          {badge.label}
        </text>
      )}
    </svg>
  );
}

/**
 * Render a brand/payment logo.
 * - If the slug exists on Simple Icons, loads the SVG.
 * - If the slug is one of the custom marks above (KHQR / ABA / ACLEDA /
 *   Wing — none of which are on Simple Icons), renders a hand-built badge.
 * - Otherwise, falls back to a plain text wordmark.
 */
export function BrandLogo({ slug, name, color = '171412', height = 28 }) {
  const [failed, setFailed] = useState(false);

  if (CUSTOM_BADGES[slug]) {
    return <CustomBadge slug={slug} height={height} />;
  }

  // Fallback if the image fails to load or slug is missing
  if (failed || !slug) {
    return (
      <span
        className="tr-logo__fallback"
        style={{
          fontSize: height * 0.5,
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: '#333',
        }}
      >
        {name}
      </span>
    );
  }

  return (
    <img
      className="tr-logo__img"
      src={`https://cdn.simpleicons.org/${slug}/${color}`}
      alt={`${name} logo`}
      loading="lazy"
      style={{ height, width: 'auto' }}
      onError={() => setFailed(true)}
    />
  );
}

/** Infinite, pause-on-hover marquee of brand logos. */
export function BrandMarquee({ brands = FASHION_BRANDS, speed = 38, height = 30 }) {
  const loop = [...brands, ...brands];
  return (
    <div className="tr-marquee" role="region" aria-label="Brands we carry">
      <div className="tr-marquee__track" style={{ animationDuration: `${speed}s` }}>
        {loop.map((b, i) => (
          <div className="tr-marquee__item" key={`${b.slug}-${i}`} aria-hidden={i >= brands.length}>
            <BrandLogo slug={b.slug} name={b.name} height={height} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Payment logos list (used in footer). */
export function PaymentLogos({ methods = PAYMENT_LOGOS }) {
  return (
    <ul className="tr-payments">
      {methods.map((m) => (
        <li className="tr-payments__item" key={m.slug} title={m.name}>
          <BrandLogo slug={m.slug} name={m.name} height={22} color="171412" />
        </li>
      ))}
    </ul>
  );
}