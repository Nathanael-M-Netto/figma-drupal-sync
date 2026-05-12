/**
 * @file useAuth.js
 * Hook de autenticação do plugin.
 */

import { useEffect, useCallback } from 'react';
import useAuthStore from '../stores/authStore';
import useAppStore from '../stores/appStore';
import { postToFigma } from './useFigmaMessages';

let isAuthListenerAdded = false;

// Uma validacao basica.
function isTokenValid(token) {
  if (!token) return false;
  // Pode colocar a logica q precisar depois
  return true;
}

function handleAuthMessage(event) {
  const msg = event.data?.pluginMessage;
  if (!msg) return;

  if (msg.type === 'session-restored') {
    if (msg.user && msg.token && isTokenValid(msg.token)) {
      useAuthStore.getState().restoreSession(msg.user, msg.token, msg.key);
      const current = useAppStore.getState().currentScreen;
      if (current === 'login') {
        useAppStore.getState().navigate('home');
      }
    }
  }
}

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, error } = useAuthStore();
  const logoutStore = useAuthStore((s) => s.logout);
  const navigate = useAppStore((s) => s.navigate);

  useEffect(() => {
    if (!isAuthListenerAdded) {
      window.addEventListener('message', handleAuthMessage);
      isAuthListenerAdded = true;
    }
  }, []);

  const checkSession = useCallback(() => {
    postToFigma({ type: 'get-session' });
  }, []);

  const logout = useCallback(async () => {
    // Aqui poderia invalidar no backend, por eqto apenas client side
    postToFigma({ type: 'clear-session' });
    logoutStore();
    navigate('login');
  }, [logoutStore, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    role: user?.role || null,
    isDevRole: user?.role === 'dev',
    logout,
    checkSession,
  };
}