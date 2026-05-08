/**
 * @file appStore.js
 * Estado global da aplicação — Zustand store.
 *
 * Gerencia:
 *   - Navegação entre telas (currentScreen)
 *   - Sistema de toasts (notificações)
 *   - Loading global
 *   - Resize do plugin
 */

import { create } from 'zustand';

/**
 * Tamanhos ideais por tela (width × height).
 * O plugin redimensiona automaticamente ao trocar de tela.
 */
export const SCREEN_SIZES = {
  login:     { width: 400, height: 520 },
  home:      { width: 460, height: 620 },
  templates: { width: 460, height: 680 },
  scan:      { width: 460, height: 700 },
  settings:  { width: 460, height: 720 },
  deploy:    { width: 460, height: 750 },
  deployReview: { width: 460, height: 780 },
  inspect:   { width: 460, height: 680 },
};

let toastIdCounter = 0;

const useAppStore = create((set, get) => ({
  // ── Estado ──
  currentScreen: 'login',
  previousScreen: null,
  toasts: [],
  isLoading: false,

  // ── Navegação ──
  navigate: (screen) => {
    const current = get().currentScreen;
    if (current === screen) return;
    set({ currentScreen: screen, previousScreen: current });
  },

  goBack: () => {
    const prev = get().previousScreen;
    if (prev) {
      set({ currentScreen: prev, previousScreen: null });
    }
  },

  // ── Toasts ──
  addToast: (toast) => {
    const id = ++toastIdCounter;
    const newToast = {
      id,
      type: toast.type || 'info',     // 'success' | 'error' | 'info' | 'warning'
      message: toast.message,
      duration: toast.duration || 4000,
    };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-dismiss
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // ── Loading ──
  setLoading: (isLoading) => set({ isLoading }),
}));

export default useAppStore;
