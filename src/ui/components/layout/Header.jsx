/**
 * @file Header.jsx
 * Cabeçalho do plugin com avatar, perfil e título da tela.
 */

import React from 'react';
import { motion } from 'framer-motion';
import useAuthStore from '../../stores/authStore';
import useAppStore from '../../stores/appStore';
import { LogOut } from 'lucide-react';

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
      className="flex items-center justify-between h-[var(--spacing-header)] px-5 bg-bg border-b border-border shrink-0 z-10"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm text-white ${isDevRole ? 'bg-gradient-to-br from-purple to-purple-hover' : 'bg-gradient-to-br from-brand to-brand-hover'}`}>
          {avatarLetter}
        </div>
        <div className="flex flex-col">
          <h1 className="m-0 text-[13px] font-semibold leading-tight text-text-primary">{title}</h1>
          <span className={`text-[10px] font-medium uppercase tracking-[0.5px] ${isDevRole ? 'text-purple' : 'text-brand'}`}>
            {roleLabel}
          </span>
        </div>
      </div>
      <button 
        className="flex items-center justify-center p-2 rounded bg-transparent border-none text-text-tertiary cursor-pointer transition-colors hover:text-danger hover:bg-danger-soft" 
        onClick={handleLogout} 
        title="Sair"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </motion.header>
  );
}
