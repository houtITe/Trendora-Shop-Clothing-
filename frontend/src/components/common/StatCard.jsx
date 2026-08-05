import Icon from './Icon.jsx';
import { useCountUp } from '../../hooks/useAnimations.js';
import './StatCard.css';

/**
 * StatCard — premium statistic tile with a count-up animation.
 * Fully data-driven: `value` is a plain number so it can later be fed
 * directly from the database (e.g. stats.happyCustomers).
 */
export function formatStat(value, { suffix = '', decimals = 0 } = {}) {
  if (decimals > 0) return value.toFixed(decimals) + suffix;
  if (value >= 1000) return `${Math.round(value / 1000)}K${suffix}`;
  return `${Math.round(value)}${suffix}`;
}

export default function StatCard({ icon = 'sparkles', value, label, suffix = '', decimals = 0 }) {
  const { ref, display } = useCountUp(value);

  return (
    <article className="tr-stat" ref={ref}>
      <span className="tr-stat__icon" aria-hidden="true">
        <Icon name={icon} size={22} />
      </span>
      <strong className="tr-stat__value">{formatStat(display, { suffix, decimals })}</strong>
      <span className="tr-stat__label">{label}</span>
    </article>
  );
}

/** Grid wrapper — pass `stats` from an API response when the backend is ready. */
export function StatGrid({ stats }) {
  return (
    <div className="tr-stat-grid">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
