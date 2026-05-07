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
import { Home, Layers, ScanLine, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    roles: ['ux', 'dev'],
    icon: Home,
  },
  {
    id: 'templates',
    label: 'Templates',
    roles: ['dev'],
    icon: Layers,
  },
  {
    id: 'scan',
    label: 'Scan',
    roles: ['ux', 'dev'],
    icon: ScanLine,
  },
  {
    id: 'settings',
    label: 'Settings',
    roles: ['dev'],
    icon: Settings,
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
    <nav className="fixed bottom-0 left-0 right-0 flex h-[var(--spacing-nav)] bg-bg border-t border-border z-20">
      {visibleItems.map((item) => {
        const isActive = currentScreen === item.id;
        const Icon = item.icon;
        
        return (
          <button
            key={item.id}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 bg-transparent border-none cursor-pointer transition-colors hover:text-text-secondary",
              isActive ? "text-brand" : "text-text-tertiary",
              isActive && item.id === 'settings' && "text-purple"
            )}
            onClick={() => navigate(item.id)}
            title={item.label}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-semibold">{item.label}</span>
            {isActive && (
              <div className="absolute top-0 left-0 right-0 flex justify-center">
                <motion.div
                  className="w-10 h-[3px] bg-current rounded-b-[3px]"
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              </div>
            )}
          </button>
        );
      })}
    </nav>
  );
}
