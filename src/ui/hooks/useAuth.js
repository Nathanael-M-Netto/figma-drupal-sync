/**
 * @file useAuth.js
 * Hook de autenticação.
 *
 * Responsabilidades:
 *   - Verificar sessão salva no clientStorage ao montar
 *   - Expor login/logout
 *   - Integrar com Zustand authStore
 */

import { useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, isTokenValid } from '../../api/authClient';
import useAuthStore from '../stores/authStore';
import useAppStore from '../stores/appStore';
import { postToFigma } from './useFigmaMessages';

/**
 * Hook de autenticação para o plugin.
 */
export function useAuth() {
  const { user, token, isAuthenticated, isLoading, error } = useAuthStore();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setError = useAuthStore((s) => s.setError);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const logoutStore = useAuthStore((s) => s.logout);
  const navigate = useAppStore((s) => s.navigate);
  const addToast = useAppStore((s) => s.addToast);

  /**
   * Escuta mensagem do sandbox com dados do clientStorage.
   * Não solicita automaticamente aqui para evitar loops em subcomponentes.
   */
  useEffect(() => {
    function handleMessage(event) {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === 'session-restored') {
        if (msg.user && msg.token && isTokenValid(msg.token)) {
          restoreSession(msg.user, msg.token, msg.key);
          
          // Só redireciona se estiver na tela de login
          const current = useAppStore.getState().currentScreen;
          if (current === 'login') {
            navigate('home');
          }
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [restoreSession, navigate]);

  /**
   * Solicita sessão salva ao sandbox (chamada manual pelo App).
   */
  const checkSession = useCallback(() => {
    postToFigma({ type: 'get-session' });
  }, []);

  /**
   * Login com username e senha.
   */
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiLogin(username, password);
      setUser(result.user);
      setToken(result.token);

      // Persiste no clientStorage
      postToFigma({
        type: 'save-session',
        user: result.user,
        token: result.token,
      });

      addToast({ type: 'success', message: `Bem-vindo, ${result.user.name}!` });
      navigate('home');

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUser, setToken, setLoading, setError, navigate, addToast]);

  /**
   * Logout — limpa estado e clientStorage.
   */
  const logout = useCallback(async () => {
    try {
      if (token) await apiLogout(token);
    } catch {}

    postToFigma({ type: 'clear-session' });
    logoutStore();
    navigate('login');
  }, [token, logoutStore, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    role: user?.role || null,
    isDevRole: user?.role === 'dev',
    login,
    logout,
    checkSession,
  };
}
