/**
 * @file scanStore.js
 * Estado do scan inteligente — Zustand store.
 *
 * Gerencia:
 *   - Status do scan (idle → scanning → validating → done)
 *   - Módulos encontrados no Figma
 *   - Relatório de validação
 *   - Preview do JSON para deploy
 */

import { create } from 'zustand';

const useScanStore = create((set) => ({
  // ── Estado ──
  status: 'idle',     // 'idle' | 'scanning' | 'validating' | 'done' | 'error'
  modules: [],        // Módulos encontrados no Figma
  report: null,       // Relatório de validação { recognized, warnings, unknown }
  jsonPreview: null,   // JSON que será enviado no deploy
  isDeploying: false,
  error: null,
  progress: 0,        // 0–100

  // ── Ações ──
  startScan: () => set({
    status: 'scanning',
    modules: [],
    report: null,
    jsonPreview: null,
    error: null,
    progress: 0,
    isDeploying: false,
  }),

  setDeploying: (isDeploying) => set({ isDeploying }),

  setProgress: (progress) => set({ progress }),

  setModules: (modules) => set({
    modules,
    status: 'validating',
    progress: 50,
  }),

  setReport: (report) => set({
    report,
    status: 'done',
    progress: 100,
  }),

  setJsonPreview: (jsonPreview) => set({ jsonPreview }),

  setError: (error) => set({
    error,
    status: 'error',
    progress: 0,
    isDeploying: false,
  }),

  reset: () => set({
    status: 'idle',
    modules: [],
    report: null,
    jsonPreview: null,
    error: null,
    progress: 0,
    isDeploying: false,
  }),
}));

export default useScanStore;
