/**
 * @file Header.jsx
 * Cabeçalho do plugin com avatar, perfil e título da tela.
 */

import React from 'react';
import { motion } from 'framer-motion';
import useAuthStore from '../../stores/authStore';
import useAppStore from '../../stores/appStore';

const SCREEN_TITLES = {
  home: 'Drupal Sync',
  templates: 'Catálogo de Templates',
  scan: 'Scan do Figma',
  settings: 'Dev Settings',
};

const ROLE_LABELS = {
  ux: 'UX Designer',
  dev: 'Developer',
};

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const currentScreen = useAppStore((s) => s.currentScreen);
  const navigate = useAppStore((s) => s.navigate);
  const logout = useAuthStore((s) => s.logout);

  if (!user || currentScreen === 'login') return null;

  const title = SCREEN_TITLES[currentScreen] || 'Drupal Sync';
  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const avatarLetter = user.name ? user.name[0].toUpperCase() : '?';
  const isDevRole = user.role === 'dev';

  const handleLogout = () => {
    // Limpa sessão do clientStorage
    try {
      parent.postMessage({ pluginMessage: { type: 'clear-session' } }, '*');
    } catch {}
    logout();
    navigate('login');
  };

  return (
    <motion.header
      className="app-header"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="header-left">
        <div className={`header-avatar ${isDevRole ? 'avatar-dev' : 'avatar-ux'}`}>
          {avatarLetter}
        </div>
        <div className="header-info">
          <h1 className="header-title">{title}</h1>
          <span className={`header-role ${isDevRole ? 'role-dev' : 'role-ux'}`}>
            {roleLabel}
          </span>
        </div>
      </div>
      <button className="header-logout" onClick={handleLogout} title="Sair">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M6 8h8"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </motion.header>
  );
}
