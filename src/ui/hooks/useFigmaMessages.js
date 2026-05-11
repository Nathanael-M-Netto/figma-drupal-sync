/**
 * @file useFigmaMessages.js
 * Hook React para comunicação bidirecional com o sandbox do Figma.
 *
 * Gerencia:
 *   - Recebimento de mensagens via window.onmessage
 *   - Envio de mensagens via parent.postMessage
 *   - Estado reativo (NID, dados extraídos, schema, API key)
 */

import { useEffect, useCallback, useRef } from 'react';
import useAuthStore from '../stores/authStore';
import { create } from 'zustand';

/**
 * Envia uma mensagem para o sandbox do Figma.
 * @param {Object} msg - Mensagem { type, ...data }
 */
export function postToFigma(msg) {
  parent.postMessage({ pluginMessage: msg }, '*');
}

// Store global para os estados do figma
export const useFigmaStore = create((set) => ({
  linkedNid: null,
  extractedData: {},
  currentMeta: null,
  currentModuleName: '',
  selectedModules: [],
  schemaStatus: { loaded: false, name: '', propCount: 0 },
  status: { text: '', type: '', visible: false },
  pageModules: [],
  syncStatus: 'idle', // 'idle' | 'checking' | 'synced' | 'outdated' | 'error'
  syncDiff: null,
  autoSyncNid: null,
  envHost: '',
  envName: 'ambiteste',

  setLinkedNid: (linkedNid) => set({ linkedNid }),
  setExtractedData: (extractedData) => set({ extractedData }),
  setCurrentMeta: (currentMeta) => set({ currentMeta }),
  setCurrentModuleName: (currentModuleName) => set({ currentModuleName }),
  setSelectedModules: (selectedModules) => set({ selectedModules }),
  setSchemaStatus: (schemaStatus) => set({ schemaStatus }),
  setStatus: (status) => set({ status }),
  setPageModules: (pageModules) => set({ pageModules }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setSyncDiff: (syncDiff) => set({ syncDiff }),
  setAutoSyncNid: (autoSyncNid) => set({ autoSyncNid }),
  setEnvHost: (envHost) => set({ envHost }),
  setEnvName: (envName) => set({ envName }),
  setSyncResult: (syncStatus, syncDiff = null) => set({ syncStatus, syncDiff }),
}));

const callbacksRef = { current: {} };
let isFigmaListenerAdded = false;

function handleFigmaMessage(event) {
  try {
    const msg = event.data?.pluginMessage;
    if (!msg) return;

    if (callbacksRef.current[msg.type]) {
      callbacksRef.current[msg.type](msg);
      delete callbacksRef.current[msg.type];
    }

    const set = useFigmaStore.setState;

    if (msg.type === 'nid-state' || msg.type === 'nid-saved') {
      set({ linkedNid: msg.nid || null });
    } else if (msg.type === 'nid-cleared') {
      set({ linkedNid: null });
    } else if (msg.type === 'init-api-key') {
      useAuthStore.getState().setApiKey(msg.key);
    } else if (msg.type === 'schema-status') {
      if (msg.status === 'success') {
        set({ schemaStatus: { loaded: true, name: msg.schemaName, propCount: msg.propCount } });
      } else if (msg.status === 'cleared') {
        set({ schemaStatus: { loaded: false, name: '', propCount: 0 } });
      }
    } else if (msg.status === 'success') {
      set({
        currentModuleName: msg.moduleName || '',
        extractedData: msg.data || {},
        currentMeta: msg.meta || null,
        selectedModules: msg.selectedModules || []
      });
    } else if (msg.status === 'error') {
      set({ status: { text: msg.message || 'Erro na extração', type: 'error', visible: true } });
    } else if (msg.type === 'update-done') {
      set({ status: { text: `${msg.moduleName}: ${msg.addedCount} props adicionadas`, type: 'success', visible: true } });
    } else if (msg.type === 'sync-done') {
      set({ status: { text: `Sync concluído! ${msg.updatedCount} campos atualizados.`, type: 'success', visible: true } });
    } else if (msg.type === 'page-modules') {
      set({ pageModules: msg.modules || [] });
    } else if (msg.type === 'auto-sync-check') {
      set({ autoSyncNid: msg.nid, syncStatus: 'checking' });
    } else if (msg.type === 'init-env-settings') {
      if (msg.envHost !== undefined) set({ envHost: msg.envHost });
      if (msg.env !== undefined) set({ envName: msg.env || 'ambiteste' });
    }
  } catch (err) {
    console.error('[useFigmaMessages] error:', err);
  }
}

/**
 * Hook que gerencia toda a comunicação com o Figma.
 *
 * @returns {Object} Estado e funções de comunicação
 */
export function useFigmaMessages() {
  const store = useFigmaStore();
  const apiKey = useAuthStore((s) => s.apiKey);
  const setStoreApiKey = useAuthStore((s) => s.setApiKey);

  useEffect(() => {
    if (!isFigmaListenerAdded) {
      window.addEventListener('message', handleFigmaMessage);
      isFigmaListenerAdded = true;
    }
  }, []);

  // Solicita NID inicial ao montar.
  useEffect(() => {
    if (!window.__figma_init_requested) {
      window.__figma_init_requested = true;
      postToFigma({ type: 'get-nid' });
    }
  }, []);

  const onceMessage = useCallback((type, callback) => {
    callbacksRef.current[type] = callback;
  }, []);

  const bindNid = useCallback((nid) => postToFigma({ type: 'set-nid', nid }), []);
  const clearNid = useCallback(() => postToFigma({ type: 'clear-nid' }), []);
  const loadSchema = useCallback((schema) => postToFigma({ type: 'load-schema', data: schema }), []);
  const clearSchema = useCallback(() => postToFigma({ type: 'clear-schema' }), []);
  const updateProps = useCallback(() => postToFigma({ type: 'update-props' }), []);
  const requestSync = useCallback((nid) => postToFigma({ type: 'run-sync-api', nid }), []);
  const applySyncData = useCallback((data) => postToFigma({ type: 'apply-sync-data', data }), []);
  const applySyncManual = useCallback((data) => postToFigma({ type: 'run-sync-manual', data }), []);
  const syncPropsLocal = useCallback(() => postToFigma({ type: 'sync-props-local' }), []);
  
  const saveApiKey = useCallback((key) => {
    setStoreApiKey(key);
    postToFigma({ type: 'save-api-key', key });
  }, [setStoreApiKey]);

  const readFullPage = useCallback((callback) => {
    return new Promise((resolve) => {
      callbacksRef.current['page-modules'] = (msg) => {
        if (typeof callback === 'function') callback(msg);
        resolve(msg);
      };
      postToFigma({ type: 'read-full-page' });
    });
  }, []);

  const showStatus = useCallback((text, type) => useFigmaStore.setState({ status: { text, type, visible: true } }), []);
  const hideStatus = useCallback(() => useFigmaStore.setState((s) => ({ status: { ...s.status, visible: false } })), []);

  const buildCleanData = useCallback(() => {
    const clean = {};
    Object.entries(store.extractedData).forEach(([k, v]) => {
      if (v !== null) clean[k] = v;
    });
    return clean;
  }, [store.extractedData]);

  const saveEnvSettings = useCallback((newEnvHost, newEnv) => {
    useFigmaStore.setState({ envHost: newEnvHost || '', envName: newEnv || 'ambiteste' });
    postToFigma({ type: 'save-env-settings', envHost: newEnvHost || '', env: newEnv || 'ambiteste' });
  }, []);

  return {
    ...store,
    apiKey,
    bindNid,
    clearNid,
    loadSchema,
    clearSchema,
    updateProps,
    requestSync,
    applySyncData,
    applySyncManual,
    syncPropsLocal,
    saveApiKey,
    readFullPage,
    showStatus,
    hideStatus,
    buildCleanData,
    setCurrentModuleName: (name) => useFigmaStore.setState({ currentModuleName: name }),
    onceMessage,
    setSyncResult: store.setSyncResult,
    saveEnvSettings,
  };
}