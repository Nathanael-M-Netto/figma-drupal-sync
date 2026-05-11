/**
 * @file useScan.js
 * Hook para o scan inteligente do Figma.
 *
 * Gerencia o fluxo: scan → validar → relatório → deploy.
 * Cruza módulos encontrados no Figma com o catálogo de templates.
 */

import { useCallback, useMemo } from 'react';
import useScanStore from '../stores/scanStore';
import useTemplateStore from '../stores/templateStore';
import useAppStore from '../stores/appStore';
import { postToFigma, useFigmaMessages } from './useFigmaMessages';
import { generateScanReport } from '../../utils/scanValidator';
import { createDrupalClient } from '../../api/drupalClient';
import { useAuth } from './useAuth';

export function useScan() {
  const {
    status,
    modules,
    report,
    jsonPreview,
    error,
    progress,
    isDeploying,
  } = useScanStore();

  const startScan = useScanStore((s) => s.startScan);
  const setModules = useScanStore((s) => s.setModules);
  const setReport = useScanStore((s) => s.setReport);
  const setJsonPreview = useScanStore((s) => s.setJsonPreview);
  const setDeploying = useScanStore((s) => s.setDeploying);
  const setError = useScanStore((s) => s.setError);
  const setProgress = useScanStore((s) => s.setProgress);
  const reset = useScanStore((s) => s.reset);

  const templates = useTemplateStore((s) => s.templates);
  const addToast = useAppStore((s) => s.addToast);
  const { token } = useAuth();
  const figma = useFigmaMessages();

  const client = useMemo(() => {
    return createDrupalClient(figma.apiKey || token);
  }, [token, figma.apiKey]);

  /**
   * Inicia o scan do Figma.
   * Envia mensagem para o sandbox ler a página inteira.
   */
  const runScan = useCallback(() => {
    startScan();
    postToFigma({ type: 'read-full-page' });
    addToast({ type: 'info', message: 'Escaneando página do Figma...' });
  }, [startScan, addToast]);

  /**
   * Processa os módulos retornados pelo sandbox e gera o relatório.
   *
   * @param {Array} figmaModules - Módulos encontrados no Figma
   */
  const processModules = useCallback((figmaModules) => {
    // Filtrar os módulos e propriedades com base no catálogo de templates
    const validModules = [];

    for (const mod of figmaModules) {
      const moduleName = mod.name.toLowerCase().trim();
      let bestMatch = null;

      // Busca o template correspondente
      for (const t of templates) {
        for (const v of t.variations) {
          const vName = v.name.toLowerCase().trim();
          const compId = (v.component_id || '').toLowerCase().trim();
          if (vName === moduleName || compId === moduleName) {
            bestMatch = v;
            break;
          }
        }
        if (bestMatch) break;
      }

      // Ignora módulos que não estão no catálogo
      if (!bestMatch) continue;

      // Filtra as propriedades (camadas) do módulo para manter apenas as conhecidas
      const expectedFields = new Set((bestMatch.fields || []).map(f => f.name.toUpperCase()));
      const filteredData = {};
      for (const [key, value] of Object.entries(mod.data || {})) {
        if (expectedFields.has(key.toUpperCase())) {
          filteredData[key] = value;
        }
      }

      validModules.push({
        ...mod,
        data: filteredData,
      });
    }

    setModules(validModules);

    // Validação profunda usando o catálogo de templates
    const scanReport = generateScanReport(validModules, templates);
    setReport(scanReport);

    // Gera preview do JSON para deploy
    const deployPayload = validModules.map((mod) => ({
      module_name: mod.name,
      order: mod.order,
      data: mod.data || {},
    }));
    setJsonPreview(deployPayload);

    const total = validModules.length;
    const okCount = scanReport.recognized.length;
    addToast({
      type: okCount > 0 ? 'success' : 'warning',
      message: `Scan concluído: ${okCount} módulos válidos encontrados.`,
    });
  }, [templates, setModules, setReport, setJsonPreview, addToast]);

  /**
   * Realiza o deploy da página inteira para o Drupal.
   */
  const deployFullPage = useCallback(async () => {
    if (!figma.linkedNid) {
      addToast({ type: 'error', message: 'Vincule um NID na Home antes de fazer deploy.' });
      return;
    }

    if (!modules || modules.length === 0) {
      addToast({ type: 'error', message: 'Nenhum módulo encontrado para deploy.' });
      return;
    }

    setDeploying(true);
    addToast({ type: 'info', message: 'Iniciando deploy em massa...' });

    try {
      await client.deployPage(figma.linkedNid, modules);
      addToast({ type: 'success', message: 'Deploy da página concluído com sucesso!' });
    } catch (err) {
      addToast({ type: 'error', message: 'Falha no deploy: ' + err.message });
    } finally {
      setDeploying(false);
    }
  }, [client, figma.linkedNid, modules, setDeploying, addToast]);

  return {
    status,
    modules,
    report,
    jsonPreview,
    error,
    progress,
    isDeploying,
    runScan,
    processModules,
    deployFullPage,
    reset,
    setProgress,
  };
}


/**
 * Busca o nome mais próximo no catálogo usando distância de edição simplificada.
 */
function findClosestMatch(name, candidates) {
  let bestMatch = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = similarity(name, candidate);
    if (score > bestScore && score > 0.5) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

/**
 * Similaridade simples baseada em substrings compartilhadas.
 */
function similarity(a, b) {
  if (a === b) return 1;
  const partsA = a.split('_');
  const partsB = b.split('_');
  let matches = 0;
  for (const part of partsA) {
    if (partsB.includes(part)) matches++;
  }
  return matches / Math.max(partsA.length, partsB.length);
}
