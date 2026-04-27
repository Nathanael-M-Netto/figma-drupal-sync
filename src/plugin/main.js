/**
 * @file main.js
 * Backend do Plugin Figma (roda no sandbox isolado).
 *
 * Este código NÃO tem acesso a rede, DOM ou browser.
 * Se comunica com a UI (React) via figma.ui.postMessage()
 * e recebe mensagens via figma.ui.onmessage.
 *
 * Responsabilidades:
 *   1. NID Persistence (salvar/ler NID no documento Figma)
 *   2. Extração de dados (ler nós do Figma → JSON)
 *   3. Sync reverso (JSON → atualizar nós do Figma)
 *   4. Leitura hierárquica de módulos (ordem visual)
 *   5. ★ Multi-mapeamento (aplicar valores em nós duplicados)
 */

import {
  buildNodeMap,
  buildModuleTree,
  extractDataFromNodeMap,
  extractWithSchema,
  applyTextToNode,
} from '../utils/nodeMapper.js';
import { extractMappedColor } from '../utils/colorMap.js';

// ══════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ══════════════════════════════════════════════════════

figma.showUI(__html__, { width: 460, height: 720 });

// --- State ---
let currentSchema = null;

// ══════════════════════════════════════════════════════
// NID PERSISTENCE (salvo na raiz do documento)
// ══════════════════════════════════════════════════════

function getLinkedNid() {
  return figma.root.getPluginData('linked_nid') || null;
}

function setLinkedNid(nid) {
  figma.root.setPluginData('linked_nid', nid);
  figma.ui.postMessage({ type: 'nid-saved', nid });
  figma.notify(`NID ${nid} vinculado ao arquivo Figma.`);
}

function clearLinkedNid() {
  figma.root.setPluginData('linked_nid', '');
  figma.ui.postMessage({ type: 'nid-cleared' });
  figma.notify('NID desvinculado do arquivo Figma.');
}

function sendNidState() {
  figma.ui.postMessage({ type: 'nid-state', nid: getLinkedNid() });
}

// ══════════════════════════════════════════════════════
// CONVERSÃO Frame → Component
// ══════════════════════════════════════════════════════

function convertFrameToComponent(frame) {
  const comp = figma.createComponent();
  comp.name = frame.name;
  comp.x = frame.x;
  comp.y = frame.y;
  comp.resize(frame.width, frame.height);
  comp.fills = JSON.parse(JSON.stringify(frame.fills));
  comp.strokes = JSON.parse(JSON.stringify(frame.strokes));
  comp.effects = JSON.parse(JSON.stringify(frame.effects));
  comp.cornerRadius = frame.cornerRadius;
  comp.clipsContent = frame.clipsContent;
  comp.layoutMode = frame.layoutMode;

  if (frame.layoutMode !== 'NONE') {
    comp.primaryAxisSizingMode = frame.primaryAxisSizingMode;
    comp.counterAxisSizingMode = frame.counterAxisSizingMode;
    comp.primaryAxisAlignItems = frame.primaryAxisAlignItems;
    comp.counterAxisAlignItems = frame.counterAxisAlignItems;
    comp.itemSpacing = frame.itemSpacing;
    comp.paddingLeft = frame.paddingLeft;
    comp.paddingRight = frame.paddingRight;
    comp.paddingTop = frame.paddingTop;
    comp.paddingBottom = frame.paddingBottom;
  }

  const parent = frame.parent;
  if (parent && 'children' in parent) {
    const idx = parent.children.indexOf(frame);
    parent.insertChild(idx, comp);
  }

  while (frame.children.length > 0) {
    comp.appendChild(frame.children[0]);
  }

  frame.remove();
  return comp;
}

// ══════════════════════════════════════════════════════
// ★ SYNC REVERSO (Drupal → Figma)
// ══════════════════════════════════════════════════════

/**
 * Aplica dados do Drupal nos nós do Figma.
 *
 * ★ MULTI-MAPEAMENTO: Para cada chave do payload, busca TODOS os
 *   nós com aquele nome via findAll(). Se TXT_TITULO existe no
 *   Desktop e no Mobile, AMBOS são atualizados.
 *
 * @param {Object} payload - Dados {key: value} do Drupal
 * @returns {Promise<number>} Quantidade de nós atualizados
 */
async function syncFromPayload(payload) {
  let updatedCount = 0;

  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) continue;

    // ★ MULTI-MAPEAMENTO: findAll retorna TODOS os nós com esse nome
    const nodes = figma.currentPage.findAll((n) => n.name === key);

    // ★ Itera sobre o ARRAY inteiro — atualiza Desktop, Mobile, e qualquer
    //   outra instância que compartilhe o mesmo nome
    for (const node of nodes) {
      if (node.type === 'TEXT') {
        const success = await applyTextToNode(node, value);
        if (success) updatedCount++;
      }
    }
  }

  return updatedCount;
}

/**
 * Sync completo de página (múltiplos módulos).
 * Recebe o JSON hierárquico da API e aplica módulo por módulo.
 *
 * @param {Array<{module_name: string, data: Object}>} modules
 * @returns {Promise<{total: number, byModule: Object}>}
 */
async function syncPageFromPayload(modules) {
  const result = { total: 0, byModule: {} };

  for (const mod of modules) {
    const count = await syncFromPayload(mod.data || {});
    result.byModule[mod.module_name] = count;
    result.total += count;
  }

  return result;
}

// ══════════════════════════════════════════════════════
// ATUALIZAÇÃO DE PROPRIEDADES (Schema → Component)
// ══════════════════════════════════════════════════════

async function atualizarPropriedades(schema) {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.notify('Selecione o módulo primeiro!');
    return;
  }

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  const rootNode = selection[0];
  let moduleComp;

  if (rootNode.type === 'COMPONENT') {
    moduleComp = rootNode;
  } else if (rootNode.type === 'COMPONENT_SET') {
    moduleComp = rootNode;
  } else if (rootNode.type === 'INSTANCE') {
    const main = rootNode.mainComponent;
    if (!main) {
      figma.notify('Instância sem componente!');
      return;
    }
    // Se a instância for parte de um Component Set, tentamos pegar o Set pai
    moduleComp = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : main;
  } else if (rootNode.type === 'FRAME') {
    moduleComp = convertFrameToComponent(rootNode);
    figma.notify('Frame convertido para Component.');
  } else {
    figma.notify('Selecione um Component Set, Component, Instance ou Frame.');
    return;
  }

  let addedCount = 0;
  let linkedCount = 0;

  const propertiesList = schema.properties || schema.schema?.properties || [];
  for (const prop of propertiesList) {
    if (prop.type === 'SLOT') continue;

    const defs = moduleComp.componentPropertyDefinitions;
    const exists = Object.keys(defs).some(
      (k) => k.split('#')[0].trim() === prop.name
    );
    if (exists) continue;

    try {
      if (prop.type === 'TEXT') {
        const safeDefault = String(prop.defaultValue || 'Texto');
        const propId = moduleComp.addComponentProperty(
          prop.name,
          'TEXT',
          safeDefault
        );
        addedCount++;

        // ★ Linka TODOS os nós de texto com o mesmo nome (Desktop e Mobile)
        const textNodes = moduleComp.findAll(
          (n) => n.type === 'TEXT' && n.name.trim() === prop.name
        );
        
        for (const textNode of textNodes) {
          textNode.componentPropertyReferences = { ...textNode.componentPropertyReferences, characters: propId };
          linkedCount++;
        }
      } else if (prop.type === 'BOOLEAN') {
        moduleComp.addComponentProperty(
          prop.name,
          'BOOLEAN',
          prop.defaultValue !== false
        );
        addedCount++;
      } else if (prop.type === 'VARIANT') {
        const defaultVal =
          (prop.options && prop.options[0]) || 'Padrao';
        moduleComp.addComponentProperty(prop.name, 'TEXT', defaultVal);
        addedCount++;
      }
    } catch (err) {
      console.error(`Erro ao adicionar "${prop.name}":`, err);
    }
  }

  moduleComp.name = schema.componentName;
  figma.notify(
    `${addedCount} propriedades adicionadas (${linkedCount} textos linkados).`
  );
  figma.ui.postMessage({
    type: 'update-done',
    addedCount,
    linkedCount,
    moduleName: schema.componentName,
  });
}

// ══════════════════════════════════════════════════════
// EXTRAÇÃO DE DADOS (Figma → JSON)
// ══════════════════════════════════════════════════════

/**
 * Entry point da extração. Chamada quando a seleção muda.
 * Delega para modo com schema ou modo livre.
 */
function lerTextosDaTela() {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({
      status: 'error',
      message: 'Selecione o módulo que deseja exportar.',
    });
    return;
  }

  // ★ MULTI-MAPEAMENTO: Usa buildNodeMap para agrupar nós por nome
  const nodeMap = buildNodeMap(selection);

  if (currentSchema) {
    const { data, meta } = extractWithSchema(nodeMap, currentSchema);
    figma.ui.postMessage({
      status: 'success',
      moduleName: currentSchema.componentName.toLowerCase(),
      data,
      meta,
      schemaMode: true,
    });
  } else {
    const data = extractDataFromNodeMap(nodeMap);

    // Detecta o nome do módulo pela seleção
    let moduleName = 'modo_livre';
    if (selection[0] && selection[0].name) {
      moduleName = selection[0].name.trim().toLowerCase();
    }

    figma.ui.postMessage({
      status: 'success',
      moduleName,
      data,
      schemaMode: false,
    });
  }
}

/**
 * Lê toda a página e retorna a árvore hierárquica de módulos.
 * Usado para Deploy completo da página.
 */
function readFullPage() {
  const modules = buildModuleTree(figma.currentPage);

  figma.ui.postMessage({
    type: 'page-modules',
    modules: modules.map((m) => ({
      name: m.name,
      order: m.order,
      data: m.data,
      nodeId: m.nodeId,
    })),
  });
}

// ══════════════════════════════════════════════════════
// MESSAGE LISTENER (UI → Sandbox)
// ══════════════════════════════════════════════════════

figma.ui.onmessage = async (msg) => {
  // --- NID Management ---
  if (msg.type === 'get-nid') {
    sendNidState();
  } else if (msg.type === 'set-nid') {
    setLinkedNid(msg.nid);
    sendNidState();
  } else if (msg.type === 'clear-nid') {
    clearLinkedNid();
    sendNidState();
  }

  // --- Schema ---
  else if (msg.type === 'load-schema') {
    currentSchema = msg.data;
    figma.ui.postMessage({
      type: 'schema-status',
      status: 'success',
      schemaName: currentSchema?.componentName,
      propCount: currentSchema?.properties.length,
    });
    // Re-extrai com o novo schema
    lerTextosDaTela();
  } else if (msg.type === 'clear-schema') {
    currentSchema = null;
    figma.ui.postMessage({ type: 'schema-status', status: 'cleared' });
    lerTextosDaTela();
  } else if (msg.type === 'update-props') {
    if (currentSchema) await atualizarPropriedades(currentSchema);
  }

  // --- Sync ---
  else if (msg.type === 'run-sync-api') {
    // Solicita à UI que faça o fetch (sandbox não tem rede)
    figma.ui.postMessage({ type: 'do-sync-fetch', nid: msg.nid });
  } else if (msg.type === 'apply-sync-data') {
    // ★ MULTI-MAPEAMENTO: syncFromPayload itera sobre arrays de nós duplicados
    const count = await syncFromPayload(msg.data);
    figma.ui.postMessage({ type: 'sync-done', updatedCount: count });
  } else if (msg.type === 'apply-sync-page') {
    // Sync de página inteira (múltiplos módulos)
    const result = await syncPageFromPayload(msg.modules);
    figma.ui.postMessage({ type: 'sync-done', updatedCount: result.total, byModule: result.byModule });
  } else if (msg.type === 'run-sync-manual') {
    const count = await syncFromPayload(msg.data);
    figma.notify(`Sync manual concluído: ${count} campos atualizados.`);
  }

  // --- Deploy ---
  else if (msg.type === 'read-full-page') {
    // Lê a página inteira para montar o payload hierárquico
    readFullPage();
  }

  // --- API Key ---
  else if (msg.type === 'save-api-key') {
    figma.clientStorage.setAsync('api_key', msg.key);
  }
};

// ══════════════════════════════════════════════════════
// EVENTOS E INICIALIZAÇÃO
// ══════════════════════════════════════════════════════

// Re-extrai dados a cada mudança de seleção
figma.on('selectionchange', lerTextosDaTela);

// Envia API Key salva para a UI na inicialização
figma.clientStorage.getAsync('api_key').then((key) => {
  if (key) figma.ui.postMessage({ type: 'init-api-key', key });
});

// Envia estado inicial do NID
sendNidState();
