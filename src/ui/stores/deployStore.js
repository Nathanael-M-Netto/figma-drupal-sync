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
import { diffModuleData } from '../../utils/pageDiffer.js';

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

  // Progresso do deploy em andamento
  deployProgress: null, // { current, total, name } | null

  // Overrides de campos não-Figma por módulo (ex: BOOL_CIRCLE_PHOTO em m13)
  moduleOverrides: {}, // { [moduleId]: { [fieldName]: value } }

  // ── Ações ──

  /**
   * Inicializa a estrutura da página para revisão.
   * @param {Array} figmaModules - Módulos lidos do Figma
   * @param {Array} drupalModules - Módulos vindo do Sync do Drupal
   */
  setPageStructure: (figmaModules, drupalModules = []) => {
    // Indexa Drupal por module_name para lookup O(1) e cálculo de removidos
    const drupalByName = new Map(
      (drupalModules || []).map((d) => [d.module_name, d])
    );

    const modules = figmaModules.map((fm, idx) => {
      const dm = drupalByName.get(fm.name);
      const diff = dm
        ? diffModuleData(fm.data, dm.data)
        : { changed: [], added: Object.keys(fm.data || {}).map((k) => ({ field: k, figmaValue: fm.data[k] })), removed: [], unchanged: [] };
      const isModified = !!(dm && (diff.changed.length > 0 || diff.removed.length > 0));

      return {
        id: fm.nodeId || `${fm.name}-${idx}`,
        name: fm.name,
        order: fm.order ?? idx,
        data: fm.data || {},
        nodeId: fm.nodeId,
        pageName: fm.pageName || null,
        source: 'figma',
        isNew: !dm,
        isModified,
        diff,
        isDeleted: false,
      };
    });

    // Módulos que existem só no Drupal (foram preservados — designer não mexeu)
    const figmaNames = new Set(figmaModules.map((m) => m.name));
    const drupalOnly = (drupalModules || [])
      .filter((d) => !figmaNames.has(d.module_name))
      .map((d, idx) => ({
        id: `drupal-${d.module_name}`,
        name: d.module_name,
        order: 1000 + idx,
        data: d.data || {},
        nodeId: null,
        source: 'drupal',
        isNew: false,
        isModified: false,
        isDeleted: false,
      }));

    set({
      pageModules: [...modules, ...drupalOnly],
      deletedModules: new Set(),
      drupalData: drupalModules,
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

  setModuleOverride: (moduleId, fieldName, value) => {
    set((state) => ({
      moduleOverrides: {
        ...state.moduleOverrides,
        [moduleId]: { ...(state.moduleOverrides[moduleId] || {}), [fieldName]: value },
      },
    }));
  },

  setContentType: (type, schema) => {
    set({ contentType: type, contentTypeSchema: schema });
  },

  setDeploying: (isDeploying) => set({ isDeploying }),

  setResult: (result) => set({ result, isDeploying: false }),

  setError: (error) => set({ error, isDeploying: false }),

  setLoading: (isLoading) => set({ isLoading }),

  setDeployProgress: (progress) => set({ deployProgress: progress }),

  reset: () => set({
    mode: null, isLoading: false, isDeploying: false,
    drupalData: null, figmaData: null, diff: null,
    pageModules: [], deletedModules: new Set(),
    contentType: null, contentTypeSchema: null, nodeFields: {},
    result: null, error: null, deployProgress: null, moduleOverrides: {},
  }),
}));

export default useDeployStore;
