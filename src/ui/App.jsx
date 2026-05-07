/**
 * @file App.jsx
 * Componente raiz do plugin Figma-Drupal Sync v3.0.
 *
 * Integra:
 *   - Autenticação e Guards de rota
 *   - Layout Redimensionável (ResizableContainer)
 *   - Navegação (NavBar + Header)
 *   - Toasts e loading global
 */

import React, { useEffect, useMemo } from 'react';

// Layout & Shared
import ResizableContainer from './components/layout/ResizableContainer';
import Header from './components/layout/Header';
import NavBar from './components/layout/NavBar';
import ToastContainer from './components/shared/Toast';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Screens
import LoginScreen from './components/auth/LoginScreen';
import BoundState from './components/home/BoundState';
import UnboundState from './components/home/UnboundState';
import TemplateList from './components/templates/TemplateList';
import ScanReport from './components/scan/ScanReport';
import DevSettingsTab from './components/dev/DevSettingsTab';
import DeployScreen from './components/deploy/DeployScreen';
import InspectScreen from './components/inspect/InspectScreen';

// Hooks & Stores
import { useAuth } from './hooks/useAuth';
import { useFigmaMessages } from './hooks/useFigmaMessages';
import { useTemplates } from './hooks/useTemplates';
import useAppStore from './stores/appStore';
import { createDrupalClient } from '../api/drupalClient';

export default function App() {
  const { isAuthenticated, isDevRole, token, checkSession } = useAuth();
  const currentScreen = useAppStore((s) => s.currentScreen);
  const navigate = useAppStore((s) => s.navigate);
  const addToast = useAppStore((s) => s.addToast);

  const figma = useFigmaMessages();
  const templateData = useTemplates(figma.apiKey || token);

  // Inicializa sessão
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Guard: redireciona para login se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated && currentScreen !== 'login') {
      navigate('login');
    } else if (isAuthenticated && currentScreen === 'login') {
      navigate('home');
    }
  }, [isAuthenticated, currentScreen, navigate]);

  // Cliente da API (agora usa a API Key explicitamente salva, com fallback para o token mock JWT)
  const client = useMemo(() => {
    return createDrupalClient(figma.apiKey || token);
  }, [token, figma.apiKey]);

  // ★ Auto-Sync: quando o plugin abre e detecta NID, busca dados do Drupal (Fase 7)
  useEffect(() => {
    if (figma.syncStatus !== 'checking' || !figma.autoSyncNid) return;

    (async () => {
      try {
        const drupalData = await client.syncPage(figma.autoSyncNid);

        if (!drupalData || Object.keys(drupalData).length === 0) {
          figma.setSyncResult('synced', null);
          return;
        }

        // Compara dados do Drupal com dados extraídos do Figma
        const figmaData = figma.extractedData || {};
        const changed = [];
        const added = [];

        for (const [key, drupalValue] of Object.entries(drupalData)) {
          if (!(key in figmaData)) {
            added.push({ field: key, drupalValue });
          } else if (String(figmaData[key]) !== String(drupalValue)) {
            changed.push({ field: key, figmaValue: figmaData[key], drupalValue });
          }
        }

        const totalChanges = changed.length + added.length;

        if (totalChanges === 0) {
          figma.setSyncResult('synced', { changed: [], added: [], removed: [], totalChanges: 0 });
        } else {
          figma.setSyncResult('outdated', { changed, added, removed: [], totalChanges });
        }
      } catch (err) {
        console.error('[Auto-Sync] Erro:', err);
        figma.setSyncResult('error', null);
      }
    })();
  }, [figma.syncStatus, figma.autoSyncNid, client]);

  // ══════════════════════════════════════════════════════
  // HANDLERS HOME / DEPLOY
  // ══════════════════════════════════════════════════════

  const buildCleanData = () => {
    const clean = {};
    Object.entries(figma.extractedData).forEach(([k, v]) => {
      if (v !== null) clean[k] = v;
    });
    return clean;
  };

  const handleDeploy = async () => {
    if (!figma.linkedNid || !figma.currentModuleName) return;
    addToast({ type: 'info', message: 'Enviando para o Drupal...' });

    try {
      const res = await client.deployModule(
        figma.linkedNid,
        figma.currentModuleName,
        buildCleanData()
      );
      addToast({ type: 'success', message: 'Deploy realizado com sucesso!' });

      const nid = res.new_nid || res.target_nid;
      if (nid && String(nid) !== String(figma.linkedNid)) {
        figma.bindNid(String(nid));
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Erro: ' + err.message });
    }
  };

  const handleDeployNewPage = async () => {
    if (!figma.currentModuleName) {
      addToast({ type: 'error', message: 'Selecione um módulo no Figma primeiro.' });
      return;
    }
    addToast({ type: 'info', message: 'Criando página no Drupal...' });

    try {
      const res = await client.createPage(
        figma.currentModuleName,
        buildCleanData()
      );
      addToast({ type: 'success', message: 'Página criada com sucesso!' });

      const nid = res.new_nid || res.target_nid;
      if (nid) figma.bindNid(String(nid));
    } catch (err) {
      addToast({ type: 'error', message: 'Erro: ' + err.message });
    }
  };

  const handleSync = () => {
    if (!figma.linkedNid) return;
    addToast({ type: 'info', message: 'Buscando dados do Drupal...' });
    figma.requestSync(figma.linkedNid);
  };

  const handleDownload = () => {
    if (!figma.linkedNid) return;
    const payload = {
      target_nid: figma.linkedNid,
      module_name: figma.currentModuleName || 'backup',
      data: buildCleanData(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (figma.currentModuleName || 'backup') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ══════════════════════════════════════════════════════
  // RENDERIZAÇÃO DE TELAS
  // ══════════════════════════════════════════════════════

  const renderScreen = () => {
    if (!isAuthenticated) {
      return <LoginScreen />;
    }

    switch (currentScreen) {
      case 'home':
        return figma.linkedNid ? (
          <BoundState
            linkedNid={figma.linkedNid}
            currentModuleName={figma.currentModuleName}
            extractedData={figma.extractedData}
            currentMeta={figma.currentMeta}
            onDeploy={handleDeploy}
            onSync={handleSync}
            onDownload={handleDownload}
            syncStatus={figma.syncStatus}
            syncDiff={figma.syncDiff}
            onApplySync={() => {
              if (figma.syncDiff) {
                const data = {};
                for (const c of figma.syncDiff.changed) data[c.field] = c.drupalValue;
                for (const a of figma.syncDiff.added) data[a.field] = a.drupalValue;
                figma.applySyncManual(data);
                figma.setSyncResult('synced', null);
                addToast({ type: 'success', message: 'Dados do Drupal aplicados no Figma!' });
              }
            }}
          />
        ) : (
          <UnboundState
            onBind={figma.bindNid}
            onDeployNewPage={handleDeployNewPage}
            currentModuleName={figma.currentModuleName}
          />
        );

      case 'templates':
        if (isDevRole) return <TemplateList apiKey={figma.apiKey || token} />;
        return <div>Acesso restrito a templates.</div>;

      case 'scan':
        return <ScanReport />;

      case 'deploy':
        return (
          <DeployScreen
            linkedNid={figma.linkedNid}
            currentModuleName={figma.currentModuleName}
            extractedData={figma.extractedData}
            client={client}
            onDeployDone={(newNid) => {
              if (newNid && !figma.linkedNid) figma.bindNid(String(newNid));
            }}
          />
        );

      case 'inspect':
        return (
          <InspectScreen
            templates={templateData.filteredTemplates}
          />
        );

      case 'settings':
        if (isDevRole) {
          return (
            <DevSettingsTab
              linkedNid={figma.linkedNid}
              apiKey={figma.apiKey}
              currentModuleName={figma.currentModuleName}
              extractedData={figma.extractedData}
              currentMeta={figma.currentMeta}
              schemaStatus={figma.schemaStatus}
              onForceNid={figma.bindNid}
              onUnlinkNid={figma.clearNid}
              onSaveApiKey={figma.saveApiKey}
              onLoadSchema={figma.loadSchema}
              onClearSchema={figma.clearSchema}
              onUpdateProps={figma.updateProps}
              onFetchSchema={async (name) => {
                if(!name) return;
                addToast({type: 'info', message: 'Buscando schema...'});
                try {
                  const schema = await client.fetchSchema(name);
                  figma.loadSchema(schema);
                  addToast({type: 'success', message: 'Schema carregado!'});
                } catch(e) {
                  addToast({type: 'error', message: e.message});
                }
              }}
              onApplyManualJson={figma.applySyncManual}
              onDevDeploy={async (effectiveNid, moduleName) => {
                if(!effectiveNid || !moduleName) return;
                addToast({type:'info', message: 'Enviando...'});
                try {
                  const res = await client.deployModule(effectiveNid, moduleName, buildCleanData());
                  addToast({type:'success', message:'Deploy concluído.'});
                  const nid = res.new_nid || res.target_nid;
                  if (nid && !figma.linkedNid) figma.bindNid(String(nid));
                } catch(e) {
                  addToast({type:'error', message: e.message});
                }
              }}
              onDevDownload={handleDownload} // Simplificado
              onSyncProps={figma.syncPropsLocal}
              status={figma.status} // Para dev settings fallback
            />
          );
        }
        return <div>Acesso restrito</div>;

      default:
        return <div>Tela não encontrada</div>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header />
      <ResizableContainer>
        <ErrorBoundary>
          {renderScreen()}
        </ErrorBoundary>
      </ResizableContainer>
      <NavBar />
      <ToastContainer />
    </div>
  );
}
