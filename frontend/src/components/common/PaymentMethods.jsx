import { useEffect, useState } from 'react';
import './PaymentMethods.css';

export const PAYMENT_METHODS = [
  {
    id: 'khqr',
    name: 'KHQR (Bakong)',
    logo: 'https://isfcambodia.org/wp-content/uploads/KHQR.svg',
  },
  {
    id: 'visa',
    name: 'Visa',
    logo: 'https://cdn.vectorstock.com/i/500p/05/32/visa-card-logo-vector-47970532.jpg',
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    logo: 'https://i.pinimg.com/originals/a9/2c/d6/a92cd6d2ea7ae55d6e114d8e52206d8d.jpg',
  },
  {
    id: 'aba',
    name: 'ABA Pay',
    logo: 'https://ibccambodia.com/wp-content/uploads/2023/09/ABA-Logo-Secondary.png.webp',
  },
  {
    id: 'acleda',
    name: 'ACLEDA',
    logo: 'https://www.acledabank.com.kh/kh/assets/layout/logo-aub.png',
  },
  {
    id: 'wing',
    name: 'Wing',
    logo: 'https://imgs.search.brave.com/i6zUSJxxoFEB5BAiWOeEHX1mW_bVj3nkcLjHfgb2NHI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGF5/LWxoLmdvb2dsZXVz/ZXJjb250ZW50LmNv/bS8xV2ZWZWhXd1Zw/QmtsMENvYWFCMXF5/VTJlenJpQXUxcjQ5/YTdwRnFMc1kzYkpf/bGFYYjJvaXRvNlBk/clJNQ3JLZWFqUT13/NDE2LWgyMzUtcnc',
  },
  {
    id: 'split',
    name: 'Split Payment (Cash + Card)',
    logo: 'https://static.vecteezy.com/system/resources/thumbnails/004/999/766/small/digital-wallet-logo-design-template-with-pixel-effect-logo-concept-of-credit-card-crypto-wallet-fast-online-payment-vector.jpg',
  },
];

export function labelForMethod(id) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.name || id;
}

export default function PaymentMethods({ selected, onSelect, className = '' }) {
  const [internal, setInternal] = useState(selected ?? 'cash');
  useEffect(() => {
    if (selected !== undefined) setInternal(selected);
  }, [selected]);

  const activeId = selected ?? internal;

  function handleSelect(id) {
    setInternal(id);
    if (onSelect) onSelect(id);
  }

  return (
    <div className={`tr-payment-methods ${className}`}>
      {PAYMENT_METHODS.map((method) => (
        <label
          key={method.id}
          className={`tr-payment-method ${
            activeId === method.id ? 'is-active' : ''
          } ${method.id === 'split' ? 'tr-payment-method--split' : ''}`}
          onClick={() => handleSelect(method.id)}
        >
          <input
            type="radio"
            name="paymentMethod"
            value={method.id}
            checked={activeId === method.id}
            onChange={() => handleSelect(method.id)}
            className="visually-hidden"
          />
          <div className="tr-payment-method__icon">
            <PaymentIcon method={method} />
          </div>
          <span className="tr-payment-method__name">{method.name}</span>
          {activeId === method.id && (
            <span className="tr-payment-method__check">✓</span>
          )}
        </label>
      ))}
    </div>
  );
}

function PaymentIcon({ method }) {
  if (typeof method.logo === 'string') {
    return (
      <img
        src={method.logo}
        alt={method.name}
        height={26}
        style={{ maxWidth: '100%', objectFit: 'contain' }}
      />
    );
  }

  // Cash icon
  if (method.id === 'cash') {
    return (
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    );
  }

  // Split payment icon
  if (method.id === 'split') {
    return (
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="6" width="14" height="10" rx="2" />
        <circle cx="17" cy="9" r="6" />
      </svg>
    );
  }

  return null;
}