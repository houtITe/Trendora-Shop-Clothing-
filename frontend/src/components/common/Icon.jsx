import React from 'react';

const PATHS = {

  home: (
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  tag: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </>
  ),
  heart: (
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <polyline points="3.5 7 12 13 20.5 7" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.4 11.2a2 2 0 002 1.6h8.2a2 2 0 002-1.6L21.5 7H6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.5c0-4.2 3.4-6.6 7.5-6.6s7.5 2.4 7.5 6.6" />
    </>
  ),
  package: (
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5Z" />
      <polyline points="3 8 12 13 21 8" />
      <line x1="12" y1="13" x2="12" y2="21" />
    </>
  ),
  logout: (
    <>
      <path d="M14 20H6a2 2 0 01-2-2V6a2 2 0 012-2h8" />
      <polyline points="16 8 20 12 16 16" />
      <line x1="20" y1="12" x2="9.5" y2="12" />
    </>
  ),
  logIn: (
    <>
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </>
  ),
  userPlus: (
    <>
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </>
  ),
  close: (
    <>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="20.5" y1="20.5" x2="16.65" y2="16.65" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  phone: (
    <path d="M21 16.9v2.6a1.7 1.7 0 01-1.9 1.7A17.6 17.6 0 012.8 4.9 1.7 1.7 0 014.5 3h2.6a1.7 1.7 0 011.7 1.5c.1 1 .4 2 .7 2.9a1.7 1.7 0 01-.4 1.8L8 10.3a14 14 0 005.7 5.7l1.1-1.1a1.7 1.7 0 011.8-.4c.9.3 1.9.6 2.9.7A1.7 1.7 0 0121 16.9Z" />
  ),
  mapPin: (
    <>
      <path d="M20 10.4c0 5.4-8 11.6-8 11.6s-8-6.2-8-11.6a8 8 0 1116 0Z" />
      <circle cx="12" cy="10" r="2.8" />
    </>
  ),
  arrowUp: (
    <>
      <line x1="12" y1="20" x2="12" y2="5" />
      <polyline points="6 11 12 5 18 11" />
    </>
  ),
  // --- Extra icons for future use ---
  arrowRight: (
    <>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </>
  ),
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  chevronRight: <polyline points="9 6 15 12 9 18" />,
  sliders: (
    <>
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <circle cx="10" cy="8" r="2.4" />
      <circle cx="15" cy="16" r="2.4" />
    </>
  ),
  filter: (
    <>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="10" y1="17" x2="14" y2="17" />
    </>
  ),
  star: (
    <path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8Z" />
  ),
  truck: (
    <>
      <rect x="1.5" y="6" width="13" height="10" rx="1.5" />
      <path d="M14.5 9.5H18l3.5 3.5V16h-7z" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="17.5" cy="18" r="1.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5.5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5V6Z" />
      <polyline points="9 12 11.2 14.2 15.4 10" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 11-2.6-5.9" />
      <polyline points="20 3.5 20 8.5 15 8.5" />
    </>
  ),
  headset: (
    <>
      <path d="M4 13v-1a8 8 0 0116 0v1" />
      <rect x="2.5" y="13" width="4.5" height="6" rx="2" />
      <rect x="17" y="13" width="4.5" height="6" rx="2" />
      <path d="M19.2 19v.6a2.4 2.4 0 01-2.4 2.4H13" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.5 20c0-3.7 2.9-5.8 6.5-5.8s6.5 2.1 6.5 5.8" />
      <path d="M16.5 5.2a3.4 3.4 0 010 6.4M18 14.6c2.2.6 3.5 2.3 3.5 5.4" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.7 4.6L18.5 9l-4.8 1.4L12 15l-1.7-4.6L5.5 9l4.8-1.4Z" />
      <path d="M18.5 15.5 19.3 18l2.2.8-2.2.8-.8 2.4-.8-2.4-2.2-.8 2.2-.8Z" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.2" />
      <polyline points="8.5 13.6 7.5 21 12 18.6 16.5 21 15.5 13.6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6.8 12 12 15.6 14" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  minus: <line x1="5" y1="12" x2="19" y2="12" />,
  inbox: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 13h4l1.6 2.6h6.8L17 13h4" />
    </>
  ),
};

const Icon = ({ name, size = 20, className = '' }) => {
  const children = PATHS[name];
  if (!children) {
    console.warn(`Icon "${name}" not found.`);
    return null;
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`tr-icon ${className}`}
      style={{ display: 'inline-flex', flexShrink: 0 }}
    >
      {children}
    </svg>
  );
};

export default Icon;