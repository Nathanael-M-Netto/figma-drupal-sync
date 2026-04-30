/**
 * @file NavBar.jsx
 * Barra de navegação inferior entre telas.
 *
 * Telas disponíveis por perfil:
 *   UX:  Home, Templates, Scan
 *   DEV: Home, Templates, Scan, Settings
 */

import React from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../../stores/appStore';
import useAuthStore from '../../stores/authStore';

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    roles: ['ux', 'dev'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2.25 6.75L9 1.5l6.75 5.25V15a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6.75z"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.75 16.5V9h4.5v7.5"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'templates',
    label: 'Templates',
    roles: ['dev'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1.5" y="10.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10.5" y="10.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'scan',
    label: 'Scan',
    roles: ['ux', 'dev'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M1.5 5.25V3a1.5 1.5 0 011.5-1.5h2.25M12.75 1.5H15a1.5 1.5 0 011.5 1.5v2.25M16.5 12.75V15a1.5 1.5 0 01-1.5 1.5h-2.25M5.25 16.5H3a1.5 1.5 0 01-1.5-1.5v-2.25"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="1.5" y1="9" x2="16.5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    roles: ['dev'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14.7 11.1a1.2 1.2 0 00.24 1.32l.04.04a1.45 1.45 0 11-2.06 2.06l-.04-.04a1.2 1.2 0 00-1.32-.24 1.2 1.2 0 00-.73 1.1v.11a1.45 1.45 0 11-2.9 0v-.06a1.2 1.2 0 00-.78-1.1 1.2 1.2 0 00-1.32.24l-.04.04a1.45 1.45 0 11-2.06-2.06l.04-.04a1.2 1.2 0 00.24-1.32 1.2 1.2 0 00-1.1-.73h-.11a1.45 1.45 0 110-2.9h.06a1.2 1.2 0 001.1-.78 1.2 1.2 0 00-.24-1.32l-.04-.04A1.45 1.45 0 115.63 3.3l.04.04a1.2 1.2 0 001.32.24h.06a1.2 1.2 0 00.73-1.1v-.11a1.45 1.45 0 012.9 0v.06a1.2 1.2 0 00.73 1.1 1.2 1.2 0 001.32-.24l.04-.04a1.45 1.45 0 012.06 2.06l-.04.04a1.2 1.2 0 00-.24 1.32v.06a1.2 1.2 0 001.1.73h.11a1.45 1.45 0 010 2.9h-.06a1.2 1.2 0 00-1.1.73z"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function NavBar() {
  const currentScreen = useAppStore((s) => s.currentScreen);
  const navigate = useAppStore((s) => s.navigate);
  const user = useAuthStore((s) => s.user);

  if (!user || currentScreen === 'login') return null;

  const userRole = user.role || 'ux';
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <nav className="nav-bar">
      {visibleItems.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            onClick={() => navigate(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {isActive && (
              <motion.div
                className="nav-indicator"
                layoutId="nav-indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
