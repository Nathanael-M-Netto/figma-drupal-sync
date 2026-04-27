/**
 * @file App.jsx
 * Componente raiz do plugin Figma-Drupal Sync.
 *
 * Orquestra a comunicação entre:
 *   - useFigmaMessages (hook) ↔ Figma sandbox (main.js)
 *   - drupalClient (API) ↔ Drupal CMS
 *
 * O App.jsx é o "ponte" entre o sandbox do Figma (que não pode
 * fazer requisições HTTP) e a API do Drupal. A UI em React
 * faz os fetch() e repassa os dados para o sandbox aplicar.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import './App.css';
import TabBar from './components/TabBar';
import DesignerTab from './components/DesignerTab';
import DevSettingsTab from './components/DevSettingsTab';
import { useFigmaMessages, postToFigma } from './hooks/useFigmaMessages';
import { createDrupalClient } from '../api/drupalClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('ux');

  // Hook de comunicação com o Figma
  const figma = useFigmaMessages();

  // Status local por aba
  const [uxStatus, setUxStatus] = useState({ text: '', type: '', visible: false });
  const [devStatus, setDevStatus] = useState({ text: '', type: '', visible: false });

  // ★ CHAMADA ÚNICA DE API: Cliente criado com a apiKey atual
  const client = useMemo(
    () => createDrupalClient(figma.apiKey),
    [figma.apiKey]
  );

  // ── Helpers ──────────────────────────────────────
  function showUxStatus(text, type) {
    setUxStatus({ text, type, visible: true });
  }

  function showDevStatus(text, type) {
    setDevStatus({ text, type, visible: true });
  }

  /**
   * Monta dados limpos (sem nulls) para envio.
   */
  function buildCleanData() {
    const clean = {};
    Object.entries(figma.extractedData).forEach(([k, v]) => {
      if (v !== null) clean[k] = v;
    });
    return clean;
  }

  /**
   * Download de JSON como arquivo local.
   */
  function downloadJSON(nid, moduleName) {
    const payload = {
      target_nid: nid,
      module_name: moduleName,
      data: buildCleanData(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (moduleName || 'backup') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ══════════════════════════════════════════════════════
  // LISTENER: Sandbox pede à UI para fazer fetch (do-sync-fetch)
  // ══════════════════════════════════════════════════════
  useEffect(() => {
    function handleMessage(event) {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === 'do-sync-fetch') {
        // ★ CHAMADA ÚNICA DE API (SYNC):
        // Busca TODOS os dados da página em uma única requisição GET
        const moduleName = figma.currentModuleName;
        if (!moduleName) {
          showUxStatus('Selecione um módulo primeiro.', 'error');
          return;
        }

        showUxStatus('Buscando dados do Drupal...', 'info');

        client
          .syncPage(msg.nid, moduleName)
          .then((res) => {
            if (res.data) {
              // Envia os dados para o sandbox aplicar nos nós do Figma
              // ★ MULTI-MAPEAMENTO: O sandbox itera sobre arrays de nós duplicados
              postToFigma({ type: 'apply-sync-data', data: res.data, nid: msg.nid });
            } else {
              showUxStatus('Nenhum dado retornado pela API.', 'error');
            }
          })
          .catch((err) => {
            showUxStatus('Erro: ' + err.message, 'error');
          });
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [client, figma.currentModuleName]);

  // ══════════════════════════════════════════════════════
  // HANDLERS — Aba Designer
  // ══════════════════════════════════════════════════════

  const handleBind = useCallback(
    (nid) => {
      figma.bindNid(nid);
    },
    [figma.bindNid]
  );

  /**
   * Deploy para Drupal (com NID existente).
   * ★ CHAMADA ÚNICA DE API: Envia todos os dados em um único POST.
   */
  const handleDeploy = useCallback(async () => {
    if (!figma.linkedNid || !figma.currentModuleName) return;

    showUxStatus('Enviando para o Drupal...', 'info');

    try {
      const res = await client.deployModule(
        figma.linkedNid,
        figma.currentModuleName,
        buildCleanData()
      );

      showUxStatus('Deploy realizado com sucesso!', 'success');

      // Atualiza NID se a API retornar um novo
      const nid = res.new_nid || res.target_nid;
      if (nid && String(nid) !== String(figma.linkedNid)) {
        figma.bindNid(String(nid));
      }
    } catch (err) {
      showUxStatus('Erro: ' + err.message, 'error');
    }
  }, [figma.linkedNid, figma.currentModuleName, figma.extractedData, client]);

  /**
   * Deploy de página nova (sem NID).
   */
  const handleDeployNewPage = useCallback(async () => {
    if (!figma.currentModuleName) {
      alert('Selecione um módulo no Figma primeiro.');
      return;
    }

    showUxStatus('Criando página no Drupal...', 'info');

    try {
      const res = await client.createPage(
        figma.currentModuleName,
        buildCleanData()
      );

      showUxStatus('Página criada com sucesso!', 'success');

      const nid = res.new_nid || res.target_nid;
      if (nid) figma.bindNid(String(nid));
    } catch (err) {
      showUxStatus('Erro: ' + err.message, 'error');
    }
  }, [figma.currentModuleName, figma.extractedData, client]);

  /**
   * Sync do Drupal (puxa dados).
   */
  const handleSync = useCallback(() => {
    if (!figma.linkedNid) return;
    showUxStatus('Buscando dados do Drupal...', 'info');
    figma.requestSync(figma.linkedNid);
  }, [figma.linkedNid, figma.requestSync]);

  /**
   * Download JSON de backup.
   */
  const handleDownload = useCallback(() => {
    if (!figma.linkedNid) return;
    downloadJSON(figma.linkedNid, figma.currentModuleName || 'backup');
  }, [figma.linkedNid, figma.currentModuleName, figma.extractedData]);

  // ══════════════════════════════════════════════════════
  // HANDLERS — Aba Dev Settings
  // ══════════════════════════════════════════════════════

  const handleForceNid = useCallback(
    (nid) => figma.bindNid(nid),
    [figma.bindNid]
  );

  const handleUnlinkNid = useCallback(
    () => figma.clearNid(),
    [figma.clearNid]
  );

  const handleSaveApiKey = useCallback(
    (key) => {
      figma.saveApiKey(key);
      showDevStatus('API Key salva com sucesso!', 'success');
    },
    [figma.saveApiKey]
  );

  const handleLoadSchema = useCallback(
    (schema) => figma.loadSchema(schema),
    [figma.loadSchema]
  );

  const handleClearSchema = useCallback(
    () => figma.clearSchema(),
    [figma.clearSchema]
  );

  const handleUpdateProps = useCallback(
    () => figma.updateProps(),
    [figma.updateProps]
  );

  /**
   * Busca schema na API.
   */
  const handleFetchSchema = useCallback(
    async (moduleName) => {
      if (!moduleName) return;
      showDevStatus('Buscando schema...', 'info');

      try {
        const schema = await client.fetchSchema(moduleName);
        figma.loadSchema(schema);
        showDevStatus('Schema carregado!', 'success');
      } catch (err) {
        showDevStatus('Erro: ' + err.message, 'error');
      }
    },
    [client, figma.loadSchema]
  );

  /**
   * Aplica JSON manual no Figma.
   */
  const handleApplyManualJson = useCallback(
    (data) => figma.applySyncManual(data),
    [figma.applySyncManual]
  );

  /**
   * Deploy do painel Dev (com override de NID).
   */
  const handleDevDeploy = useCallback(
    async (effectiveNid, moduleName) => {
      if (!effectiveNid || !moduleName) {
        alert('Preencha o NID e o Nome do Módulo!');
        return;
      }

      showDevStatus('Enviando para o Drupal...', 'info');

      try {
        const res = await client.deployModule(
          effectiveNid,
          moduleName,
          buildCleanData()
        );

        showDevStatus('Deploy realizado!', 'success');

        const nid = res.new_nid || res.target_nid;
        if (nid && !figma.linkedNid) figma.bindNid(String(nid));
      } catch (err) {
        showDevStatus('Erro: ' + err.message, 'error');
      }
    },
    [client, figma.extractedData, figma.linkedNid]
  );

  /**
   * Download JSON do painel Dev.
   */
  const handleDevDownload = useCallback(
    (effectiveNid, moduleName) => {
      if (!effectiveNid || !moduleName) {
        alert('Preencha o NID e o Nome do Módulo!');
        return;
      }
      downloadJSON(effectiveNid, moduleName);
    },
    [figma.extractedData]
  );

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════

  return (
    <>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'ux' && (
        <DesignerTab
          linkedNid={figma.linkedNid}
          currentModuleName={figma.currentModuleName}
          extractedData={figma.extractedData}
          currentMeta={figma.currentMeta}
          onBind={handleBind}
          onDeploy={handleDeploy}
          onDeployNewPage={handleDeployNewPage}
          onSync={handleSync}
          onDownload={handleDownload}
          status={uxStatus}
        />
      )}

      {activeTab === 'dev' && (
        <DevSettingsTab
          linkedNid={figma.linkedNid}
          apiKey={figma.apiKey}
          currentModuleName={figma.currentModuleName}
          extractedData={figma.extractedData}
          currentMeta={figma.currentMeta}
          schemaStatus={figma.schemaStatus}
          onForceNid={handleForceNid}
          onUnlinkNid={handleUnlinkNid}
          onSaveApiKey={handleSaveApiKey}
          onLoadSchema={handleLoadSchema}
          onClearSchema={handleClearSchema}
          onUpdateProps={handleUpdateProps}
          onFetchSchema={handleFetchSchema}
          onApplyManualJson={handleApplyManualJson}
          onDevDeploy={handleDevDeploy}
          onDevDownload={handleDevDownload}
          onSyncProps={figma.syncPropsLocal}
          status={devStatus}
        />
      )}
    </>
  );
}
