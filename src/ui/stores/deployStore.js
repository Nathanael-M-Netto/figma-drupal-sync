/**
 * @file deployStore.js
 * Estado do Deploy — Zustand store.
 *
 * Gerencia:
 *   - Modo do deploy (update vs newPage)
 *   - Diff entre dados do Figma e Drupal
 *   - Campos do content-type para formulário
 *   - Status de execução do deploy
 */

import { create } from 'zustand';

const useDeployStore = create((set, get) => ({
  // ── Estado ──
  mode: null,           // 'update' | 'newPage'
  isLoading: false,
  isDeploying: false,
  
  // Dados
  drupalData: null,     // Dados atuais do Drupal (GET /figma/pull/{nid})
  figmaData: null,      // Dados extraídos do Figma
  diff: null,           // { changed: [], added: [], removed: [], unchanged: [] }
  
  // Content-type fields
  contentType: null,    // Ex: 'page', 'landing_page'
  contentTypeSchema: null, // Schema dos campos do content-type
  nodeFields: {},       // Valores preenchidos pelo usuário para campos do node
  
  // Resultado
  result: null,         // { success, nid, message }
  error: null,

  // ── Ações ──

  /**
   * Prepara o deploy analisando os dados.
   * @param {'update'|'newPage'} mode
   * @param {Object} figmaData - Dados extraídos do Figma
   * @param {Object|null} drupalData - Dados atuais do Drupal (null para newPage)
   * @param {Object|null} contentTypeSchema - Schema dos campos
   */
  prepareDeploy: (mode, figmaData, drupalData = null, contentTypeSchema = null) => {
    let diff = null;

    if (mode === 'update' && drupalData) {
      const changed = [];
      const added = [];
      const removed = [];
      const unchanged = [];

      // Figma → Drupal comparison
      for (const [key, figmaValue] of Object.entries(figmaData)) {
        if (!(key in drupalData)) {
          added.push({ field: key, newValue: figmaValue });
        } else if (String(drupalData[key]) !== String(figmaValue)) {
          changed.push({ field: key, oldValue: drupalData[key], newValue: figmaValue });
        } else {
          unchanged.push({ field: key, value: figmaValue });
        }
      }
      
      // Drupal fields not in Figma
      for (const [key, drupalValue] of Object.entries(drupalData)) {
        if (!(key in figmaData)) {
          removed.push({ field: key, oldValue: drupalValue });
        }
      }

      diff = { changed, added, removed, unchanged, totalChanges: changed.length + added.length };
    }

    set({
      mode,
      figmaData,
      drupalData,
      diff,
      contentTypeSchema,
      isLoading: false,
      error: null,
      result: null,
      nodeFields: {},
    });
  },

  setNodeField: (fieldName, value) => {
    set((state) => ({
      nodeFields: { ...state.nodeFields, [fieldName]: value },
    }));
  },

  setContentType: (type, schema) => {
    set({ contentType: type, contentTypeSchema: schema });
  },

  setDeploying: (isDeploying) => set({ isDeploying }),

  setResult: (result) => set({ result, isDeploying: false }),

  setError: (error) => set({ error, isDeploying: false }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({
    mode: null, isLoading: false, isDeploying: false,
    drupalData: null, figmaData: null, diff: null,
    contentType: null, contentTypeSchema: null, nodeFields: {},
    result: null, error: null,
  }),
}));

export default useDeployStore;
