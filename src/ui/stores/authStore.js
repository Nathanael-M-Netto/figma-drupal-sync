/**
 * @file authStore.js
 * Estado de autenticação — Zustand store.
 *
 * Gerencia:
 *   - Dados do usuário (name, email, role)
 *   - Token JWT (mock por enquanto)
 *   - Flag de autenticação
 */

import { create } from 'zustand';

const useAuthStore = create((set) => ({
  // ── Estado ──
  user: null,        // { id, name, email, role: 'ux' | 'dev' }
  token: null,
  apiKey: import.meta.env.VITE_API_KEY || '6E0D8A5D-D7D2-44D5-B0A5-50610C2E605D',
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ── Ações ──
  setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),

  setToken: (token) => set({ token }),

  setApiKey: (apiKey) => set({ apiKey }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  logout: () => set({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),

  /**
   * Restaura sessão salva no clientStorage.
   */
  restoreSession: (user, token, apiKey) => set({
    user,
    token,
    apiKey: apiKey || import.meta.env.VITE_API_KEY || '6E0D8A5D-D7D2-44D5-B0A5-50610C2E605D',
    isAuthenticated: true,
    isLoading: false,
    error: null,
  }),
}));

export default useAuthStore;
