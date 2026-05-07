/**
 * @file useFigmaMessages.js
 * Hook React para comunicação bidirecional com o sandbox do Figma.
 *
 * Gerencia:
 *   - Recebimento de mensagens via window.onmessage
 *   - Envio de mensagens via parent.postMessage
 *   - Estado reativo (NID, dados extraídos, schema, API key)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useAuthStore from '../stores/authStore';

/**
 * Envia uma mensagem para o sandbox do Figma.
 * @param {Object} msg - Mensagem { type, ...data }
 */
export function postToFigma(msg) {
  parent.postMessage({ pluginMessage: msg }, '*');
}

/**
 * Hook que gerencia toda a comunicação com o Figma.
 *
 * @returns {Object} Estado e funções de comunicação
 */
export function useFigmaMessages() {
  // --- Estado ---
  const [linkedNid, setLinkedNid] = useState(null);
  const apiKey = useAuthStore((s) => s.apiKey);
  const setStoreApiKey = useAuthStore((s) => s.setApiKey);
  const [extractedData, setExtractedData] = useState({});
  const [currentMeta, setCurrentMeta] = useState(null);
  const [currentModuleName, setCurrentModuleName] = useState('');
  const [schemaStatus, setSchemaStatus] = useState({ loaded: false, name: '', propCount: 0 });
  const [status, setStatus] = useState({ text: '', type: '', visible: false });
  const [pageModules, setPageModules] = useState([]);

  // ★ Auto-Sync State (Fase 7)
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'checking' | 'synced' | 'outdated' | 'error'
  const [syncDiff, setSyncDiff] = useState(null); // { changed: [], added: [], removed: [], totalChanges: 0 }
  const [autoSyncNid, setAutoSyncNid] = useState(null);

  // Ref para callbacks que dependem de estado atualizado
  const callbacksRef = useRef({});

  /**
   * Registra um callback one-shot para um tipo de mensagem.
   * Usado pela UI para esperar respostas do sandbox (ex: sync-done).
   */
  const onceMessage = useCallback((type, callback) => {
    callbacksRef.current[type] = callback;
  }, []);

  // --- Message Listener ---
  useEffect(() => {
    function handleMessage(event) {
      try {
        const msg = event.data?.pluginMessage;
        if (!msg) return;

        // Dispara callbacks one-shot
        if (callbacksRef.current[msg.type]) {
          callbacksRef.current[msg.type](msg);
          delete callbacksRef.current[msg.type];
        }

        // --- NID ---
        if (msg.type === 'nid-state' || msg.type === 'nid-saved') {
          setLinkedNid(msg.nid || null);
        } else if (msg.type === 'nid-cleared') {
          setLinkedNid(null);
        }

        // --- API Key ---
        else if (msg.type === 'init-api-key') {
          setStoreApiKey(msg.key);
        }

        // --- Schema ---
        else if (msg.type === 'schema-status') {
          if (msg.status === 'success') {
            setSchemaStatus({
              loaded: true,
              name: msg.schemaName,
              propCount: msg.propCount,
            });
          } else if (msg.status === 'cleared') {
            setSchemaStatus({ loaded: false, name: '', propCount: 0 });
          }
        }

        // --- Extração de dados ---
        else if (msg.status === 'success') {
          setCurrentModuleName(msg.moduleName || '');
          setExtractedData(msg.data || {});
          setCurrentMeta(msg.meta || null);
        } else if (msg.status === 'error') {
          setStatus({
            text: msg.message || 'Erro na extração',
            type: 'error',
            visible: true,
          });
        }

        // --- Update props ---
        else if (msg.type === 'update-done') {
          setStatus({
            text: `${msg.moduleName}: ${msg.addedCount} props adicionadas`,
            type: 'success',
            visible: true,
          });
        }

        // --- Sync done ---
        else if (msg.type === 'sync-done') {
          setStatus({
            text: `Sync concluído! ${msg.updatedCount} campos atualizados.`,
            type: 'success',
            visible: true,
          });
        }

        // --- Page modules ---
        else if (msg.type === 'page-modules') {
          setPageModules(msg.modules || []);
        }

        // --- Auto-Sync Check (Fase 7) ---
        else if (msg.type === 'auto-sync-check') {
          setAutoSyncNid(msg.nid);
          setSyncStatus('checking');
          // A UI (App.jsx) vai interceptar isso e fazer o fetch real
        }

        // --- do-sync-fetch (sandbox pede à UI para fazer o fetch) ---
        // Este evento é tratado diretamente no App.jsx pois precisa
        // chamar o drupalClient
        // (delegado via onceMessage ou callback externo)

      } catch (err) {
        console.error('[useFigmaMessages] error:', err);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Solicita NID inicial ao montar
  useEffect(() => {
    postToFigma({ type: 'get-nid' });
  }, []);

  // --- Ações ---
  const bindNid = useCallback((nid) => {
    postToFigma({ type: 'set-nid', nid });
  }, []);

  const clearNid = useCallback(() => {
    postToFigma({ type: 'clear-nid' });
  }, []);

  const loadSchema = useCallback((schema) => {
    postToFigma({ type: 'load-schema', data: schema });
  }, []);

  const clearSchema = useCallback(() => {
    postToFigma({ type: 'clear-schema' });
  }, []);

  const updateProps = useCallback(() => {
    postToFigma({ type: 'update-props' });
  }, []);

  const requestSync = useCallback((nid) => {
    postToFigma({ type: 'run-sync-api', nid });
  }, []);

  const applySyncData = useCallback((data) => {
    postToFigma({ type: 'apply-sync-data', data });
  }, []);

  const applySyncManual = useCallback((data) => {
    postToFigma({ type: 'run-sync-manual', data });
  }, []);

  const syncPropsLocal = useCallback(() => {
    postToFigma({ type: 'sync-props-local' });
  }, []);

  const saveApiKey = useCallback((key) => {
    setStoreApiKey(key);
    postToFigma({ type: 'save-api-key', key });
  }, [setStoreApiKey]);

  const readFullPage = useCallback(() => {
    postToFigma({ type: 'read-full-page' });
  }, []);

  const showStatus = useCallback((text, type) => {
    setStatus({ text, type, visible: true });
  }, []);

  const hideStatus = useCallback(() => {
    setStatus((s) => ({ ...s, visible: false }));
  }, []);

  /**
   * Constrói os dados limpos para envio (remove nulls).
   */
  const buildCleanData = useCallback(() => {
    const clean = {};
    Object.entries(extractedData).forEach(([k, v]) => {
      if (v !== null) clean[k] = v;
    });
    return clean;
  }, [extractedData]);

  /**
   * Atualiza o status do auto-sync após verificar com a API.
   * @param {'synced'|'outdated'|'error'} newStatus
   * @param {Object|null} diff - Diff de campos
   */
  const setSyncResult = useCallback((newStatus, diff = null) => {
    setSyncStatus(newStatus);
    setSyncDiff(diff);
  }, []);

  return {
    // Estado
    linkedNid,
    apiKey,
    extractedData,
    currentMeta,
    currentModuleName,
    schemaStatus,
    status,
    pageModules,
    syncStatus,
    syncDiff,
    autoSyncNid,

    // Ações
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
    setCurrentModuleName,
    onceMessage,
    setSyncResult,
  };
}
