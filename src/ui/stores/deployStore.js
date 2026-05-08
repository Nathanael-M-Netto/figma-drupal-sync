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
  drupalData: null,     // Dados atuais do Drupal (GET /api/nodes/{nid}/sync-payload)
  figmaData: null,      // Dados extraídos do Figma
  diff: null,           // { changed: [], added: [], removed: [], unchanged: [] }
  
  // Page Structure (Fase 8)
  pageModules: [],      // Lista de módulos na página Figma [{id, name, data, order, isNew, isModified, isDeleted}]
  deletedModules: new Set(), // IDs de módulos que o usuário marcou para deletar
  
  // Content-type fields
  contentType: null,    // Ex: 'page', 'landing_page'
  contentTypeSchema: null, // Schema dos campos do content-type
  nodeFields: {},       // Valores preenchidos pelo usuário para campos do node
  
  // Resultado
  result: null,         // { success, nid, message }
  error: null,
  
  // ── Ações ──

  /**
   * Inicializa a estrutura da página para revisão.
   * @param {Array} figmaModules - Módulos lidos do Figma
   * @param {Array} drupalModules - Módulos vindo do Sync do Drupal
   */
  setPageStructure: (figmaModules, drupalModules = []) => {
    const modules = figmaModules.map(fm => {
      // Tenta encontrar o correspondente no Drupal para marcar como modificado ou não
      const dm = drupalModules.find(d => d.module_name === fm.name);
      const isModified = dm ? JSON.stringify(dm.data) !== JSON.stringify(fm.data) : true;
      
      return {
        ...fm,
        isNew: !dm,
        isModified,
        isDeleted: false
      };
    });

    set({ 
      pageModules: modules,
      deletedModules: new Set(),
      drupalData: drupalModules
    });
  },

  toggleModuleDelete: (moduleId) => {
    set((state) => {
      const nextDeleted = new Set(state.deletedModules);
      if (nextDeleted.has(moduleId)) {
        nextDeleted.delete(moduleId);
      } else {
        nextDeleted.add(moduleId);
      }
      return { deletedModules: nextDeleted };
    });
  },

  /**
   * Prepara o deploy analisando os dados.
   */
  prepareDeploy: (mode, figmaData, drupalData = null, contentTypeSchema = null) => {
    set({
      mode,
      figmaData,
      drupalData,
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
    pageModules: [], deletedModules: new Set(),
    contentType: null, contentTypeSchema: null, nodeFields: {},
    result: null, error: null,
  }),
}));

export default useDeployStore;
