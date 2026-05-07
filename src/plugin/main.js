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
  identifySharedProps,
  matchModuleToTemplate,
  buildFullPageScanReport,
} from '../utils/nodeMapper.js';
import { extractMappedColor } from '../utils/colorMap.js';

// ══════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ══════════════════════════════════════════════════════

figma.showUI(__html__, { width: 460, height: 720 });

// --- State ---
let currentSchema = null;
let lastExtractedNodeMap = null; // Guarda o mapa da última seleção para Sync Local focado

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
  
  if ('fills' in frame) comp.fills = JSON.parse(JSON.stringify(frame.fills));
  if ('strokes' in frame) comp.strokes = JSON.parse(JSON.stringify(frame.strokes));
  if ('effects' in frame) comp.effects = JSON.parse(JSON.stringify(frame.effects));
  if ('cornerRadius' in frame) comp.cornerRadius = frame.cornerRadius;
  if ('clipsContent' in frame) comp.clipsContent = frame.clipsContent;
  
  if ('layoutMode' in frame && frame.layoutMode !== 'NONE') {
    comp.layoutMode = frame.layoutMode;
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
 * Aplica dados do Drupal (ou local) nos nós do Figma.
 *
 * Se nodeMapScope for fornecido (Sync Local), aplica restrito àquela seleção.
 * Se não (Sync da API), busca globalmente na página usando findAll.
 *
 * @param {Object} payload - Dados {key: value}
 * @param {Map} [nodeMapScope] - Mapa opcional para restringir o escopo
 * @returns {Promise<number>} Quantidade de nós atualizados
 */
async function syncFromPayload(payload, nodeMapScope = null) {
  let updatedCount = 0;

  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) continue;

    // ★ Busca no escopo restrito ou globalmente na página inteira
    const nodes = nodeMapScope 
      ? (nodeMapScope.get(key) || []) 
      : figma.currentPage.findAll((n) => n.name === key);

    for (const node of nodes) {
      if (node.type === 'TEXT') {
        const success = await applyTextToNode(node, value);
        if (success) updatedCount++;
      } else if (node.type === 'INSTANCE' && typeof value === 'object') {
        // Aplica propriedades de componente (variantes, booleans) no INSTANCE
        try {
          const currentProps = node.componentProperties;
          const newProps = {};
          let hasChange = false;

          for (const [k, v] of Object.entries(value)) {
            // Busca o nome real da propriedade (ex: "PHOTO_CIRCLE#23:45")
            const rawKey = Object.keys(currentProps).find(ck => ck.split('#')[0].trim() === k);
            if (rawKey) {
              let finalVal = v;
              if (currentProps[rawKey].type === 'BOOLEAN') {
                finalVal = (v === 'true' || v === true);
              }
              newProps[rawKey] = finalVal;
              hasChange = true;
            }
          }

          if (hasChange) {
            node.setProperties(newProps);
            updatedCount++;
          }
        } catch (err) {
          console.error(`Erro ao atualizar instância "${node.name}":`, err);
        }
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
    figma.notify('Selecione os módulos primeiro!');
    return;
  }

  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  let addedCount = 0;
  let linkedCount = 0;

  for (const rootNode of selection) {
    let moduleComp;

    if (rootNode.type === 'COMPONENT') {
      moduleComp = rootNode;
    } else if (rootNode.type === 'COMPONENT_SET') {
      moduleComp = rootNode;
    } else if (rootNode.type === 'INSTANCE') {
      const main = rootNode.mainComponent;
      if (!main) continue;
      moduleComp = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : main;
    } else if (rootNode.type === 'FRAME' || rootNode.type === 'GROUP') {
      moduleComp = convertFrameToComponent(rootNode);
    } else {
      continue;
    }

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
          const defaultVal = (prop.options && prop.options[0]) || 'Padrao';
          moduleComp.addComponentProperty(prop.name, 'TEXT', defaultVal);
          addedCount++;
        }
      } catch (err) {
        console.error(`Erro ao adicionar "${prop.name}":`, err);
      }
    }
    moduleComp.name = schema.componentName || moduleComp.name;
  }

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
 * Suporta seleção múltipla (Ctrl+A) ou única, identificando e combinando módulos irmãos.
 */
function lerTextosDaTela() {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({
      status: 'error',
      message: 'Selecione pelo menos um módulo que deseja exportar/sincronizar.',
    });
    return;
  }

  let nodesToExtract = [...selection];

  // Se selecionou apenas 1 e tem sufixo, busca o irmão automaticamente (Desktop + Mobile)
  if (selection.length === 1 && selection[0].name) {
    const rawName = selection[0].name.trim().toLowerCase();
    const baseName = rawName.replace(/(_desk|_desktop|_mobile|_mob)$/, '');

    if (rawName !== baseName) {
      const parent = selection[0].parent;
      if (parent && 'children' in parent) {
        const siblings = parent.children.filter((n) => {
          const nName = n.name.trim().toLowerCase();
          return nName !== rawName && nName.replace(/(_desk|_desktop|_mobile|_mob)$/, '') === baseName;
        });
        
        for (const sib of siblings) {
          if (!nodesToExtract.includes(sib)) {
            nodesToExtract.push(sib);
          }
        }
      }
    }
  }

  // Agrupa a seleção usando a mesma lógica de buildModuleTree
  const modules = buildModuleTree({ children: nodesToExtract });

  if (modules.length === 0) {
    // Modo de fallback caso não identifique módulos estruturados (ex: selecionou apenas um texto solto)
    const nodeMap = buildNodeMap(selection);
    lastExtractedNodeMap = nodeMap;

    let moduleName = 'modo_livre';
    if (selection[0] && selection[0].name) {
      moduleName = selection[0].name.trim().toLowerCase().replace(/(_desk|_desktop|_mobile|_mob)$/, '');
    }

    if (currentSchema) {
      const { data, meta } = extractWithSchema(nodeMap, currentSchema);
      figma.ui.postMessage({
        status: 'success',
        moduleName,
        data,
        meta,
        schemaMode: true,
      });
    } else {
      const data = extractDataFromNodeMap(nodeMap);
      figma.ui.postMessage({
        status: 'success',
        moduleName,
        data,
        schemaMode: false,
      });
    }
    return;
  }

  // Se a seleção contém múltiplos módulos distintos
  if (modules.length > 1) {
    // Junta os nodeMaps de todos para permitir Sync Local de múltiplos módulos de uma vez
    const combinedNodeMap = new Map();
    for (const mod of modules) {
      for (const [k, v] of mod.nodeMap.entries()) {
        if (!combinedNodeMap.has(k)) combinedNodeMap.set(k, []);
        combinedNodeMap.get(k).push(...v);
      }
    }
    lastExtractedNodeMap = combinedNodeMap;

    figma.ui.postMessage({
      status: 'success',
      moduleName: 'Múltiplos Módulos',
      data: { _modules: modules.map(m => m.name) },
      schemaMode: false,
    });
    return;
  }

  // Seleção contém exatamente 1 módulo (que já pode ter agrupado _desk e _mobile)
  const mod = modules[0];
  lastExtractedNodeMap = mod.nodeMap;

  if (currentSchema) {
    const { data, meta } = extractWithSchema(mod.nodeMap, currentSchema);
    figma.ui.postMessage({
      status: 'success',
      moduleName: mod.name,
      data,
      meta,
      schemaMode: true,
    });
  } else {
    figma.ui.postMessage({
      status: 'success',
      moduleName: mod.name,
      data: mod.data,
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
  } else if (msg.type === 'sync-props-local') {
    // ★ SYNC LOCAL (Desk <-> Mobile) apenas nos nós atualmente selecionados
    if (!lastExtractedNodeMap) {
      figma.notify('Nenhum dado selecionado para sincronizar.');
      return;
    }
    // Extrai os dados unificados da seleção atual
    let dataToApply = extractDataFromNodeMap(lastExtractedNodeMap);
    if (currentSchema) {
      const result = extractWithSchema(lastExtractedNodeMap, currentSchema);
      dataToApply = result.data;
    }
    
    // Reaplica esses mesmos dados no escopo da seleção
    const count = await syncFromPayload(dataToApply, lastExtractedNodeMap);
    figma.notify(`Sync Local concluído: ${count} propriedades igualadas.`);
  }

  // --- Deploy ---
  else if (msg.type === 'read-full-page') {
    // Lê a página inteira para montar o payload hierárquico
    readFullPage();
  }

  // --- Scan & Property Loading (Fase 6) ---
  else if (msg.type === 'scan-and-load-props') {
    // Escaneia TODA a página, faz match com catálogo, e carrega propriedades
    const page = figma.currentPage;
    const templates = msg.templates || [];
    const report = buildFullPageScanReport(page, templates);

    // Para cada módulo com match, tenta carregar propriedades
    let totalPropsCreated = 0;
    let totalLinksCreated = 0;

    for (const mod of report) {
      if (mod.matchResult.matchType === 'none') continue;

      // Busca o nó raiz
      let rootNode = null;
      for (const child of page.children) {
        if (child.id === mod.nodeId) {
          rootNode = child;
          break;
        }
      }
      if (!rootNode) continue;

      // Identifica props shared vs exclusive
      const analysis = identifySharedProps(rootNode);

      // Converte o frame para componente se ainda não for
      let component = rootNode;
      if (rootNode.type === 'FRAME' || rootNode.type === 'GROUP') {
        try {
          component = figma.createComponentFromNode(rootNode);
        } catch (e) {
          console.warn(`[scan-and-load] Não pôde converter ${rootNode.name} para Component:`, e);
          continue;
        }
      }

      // Carrega propriedades compartilhadas (Desktop + Mobile linkados)
      for (const shared of analysis.shared) {
        try {
          const allNodes = [...shared.deskNodes, ...shared.mobileNodes];
          if (shared.type === 'TEXT') {
            // Cria uma única text property e linka todos os nós
            const propName = shared.name;
            const existingProps = component.componentPropertyDefinitions || {};
            if (!existingProps[propName]) {
              const firstTextNode = allNodes.find(n => n.type === 'TEXT');
              component.addComponentProperty(propName, 'TEXT', firstTextNode?.characters || '');
              totalPropsCreated++;
            }
            // Linka ambos desk e mobile ao mesmo property
            for (const node of allNodes) {
              if (node.type === 'TEXT') {
                try {
                  node.componentPropertyReferences = { characters: propName };
                  totalLinksCreated++;
                } catch (e) {
                  // Silently skip nodes that can't be linked
                }
              }
            }
          } else if (shared.type === 'BOOLEAN') {
            const propName = shared.name;
            const existingProps = component.componentPropertyDefinitions || {};
            if (!existingProps[propName]) {
              component.addComponentProperty(propName, 'BOOLEAN', true);
              totalPropsCreated++;
            }
            for (const node of allNodes) {
              try {
                node.componentPropertyReferences = { visible: propName };
                totalLinksCreated++;
              } catch (e) {}
            }
          }
        } catch (err) {
          console.warn(`[scan-and-load] Erro ao criar prop shared ${shared.name}:`, err);
        }
      }

      // Carrega propriedades exclusivas (desk ou mobile only)
      const exclusiveProps = [...analysis.deskOnly, ...analysis.mobileOnly, ...analysis.allProps];
      for (const prop of exclusiveProps) {
        try {
          const propName = prop.name;
          const existingProps = component.componentPropertyDefinitions || {};
          if (!existingProps[propName]) {
            if (prop.type === 'TEXT') {
              const firstTextNode = prop.nodes.find(n => n.type === 'TEXT');
              component.addComponentProperty(propName, 'TEXT', firstTextNode?.characters || '');
              totalPropsCreated++;
            } else if (prop.type === 'BOOLEAN') {
              component.addComponentProperty(propName, 'BOOLEAN', true);
              totalPropsCreated++;
            }
          }
          for (const node of prop.nodes) {
            try {
              if (node.type === 'TEXT' && prop.type === 'TEXT') {
                node.componentPropertyReferences = { characters: propName };
                totalLinksCreated++;
              } else if (prop.type === 'BOOLEAN') {
                node.componentPropertyReferences = { visible: propName };
                totalLinksCreated++;
              }
            } catch (e) {}
          }
        } catch (err) {
          console.warn(`[scan-and-load] Erro ao criar prop exclusive ${prop.name}:`, err);
        }
      }
    }

    figma.ui.postMessage({
      type: 'scan-load-done',
      report: report.map(r => ({
        name: r.name,
        nodeId: r.nodeId,
        matchType: r.matchResult.matchType,
        matchScore: r.matchResult.score,
        templateName: r.matchResult.template?.componentName || null,
        propsAnalysis: r.propsAnalysis,
        expectedProps: r.expectedProps,
        foundProps: r.foundProps,
      })),
      totalPropsCreated,
      totalLinksCreated,
    });

    figma.notify(`Scan concluído: ${totalPropsCreated} props criadas, ${totalLinksCreated} links feitos.`);
  }

  // Relatório de scan sem carregar props (apenas leitura)
  else if (msg.type === 'full-page-scan-report') {
    const page = figma.currentPage;
    const templates = msg.templates || [];
    const report = buildFullPageScanReport(page, templates);

    figma.ui.postMessage({
      type: 'scan-report-result',
      report: report.map(r => ({
        name: r.name,
        nodeId: r.nodeId,
        order: r.order,
        matchType: r.matchResult.matchType,
        matchScore: r.matchResult.score,
        templateName: r.matchResult.template?.componentName || null,
        propsAnalysis: r.propsAnalysis,
        expectedProps: r.expectedProps,
        foundProps: r.foundProps,
      })),
    });
  }

  // --- Session & Auth (v3.0) ---
  else if (msg.type === 'save-session') {
    figma.clientStorage.setAsync('auth_user', msg.user);
    figma.clientStorage.setAsync('auth_token', msg.token);
  } else if (msg.type === 'get-session') {
    Promise.all([
      figma.clientStorage.getAsync('auth_user'),
      figma.clientStorage.getAsync('auth_token'),
      figma.clientStorage.getAsync('api_key')
    ]).then(([user, token, key]) => {
      figma.ui.postMessage({ type: 'session-restored', user, token, key });
    });
  } else if (msg.type === 'clear-session') {
    figma.clientStorage.deleteAsync('auth_user');
    figma.clientStorage.deleteAsync('auth_token');
  }

  // --- UI Layout (v3.0) ---
  else if (msg.type === 'resize-ui') {
    figma.ui.resize(msg.width, msg.height);
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

// Envia auto-sync-check se NID existir (Fase 7)
const initNid = getLinkedNid();
if (initNid) {
  figma.ui.postMessage({ type: 'auto-sync-check', nid: initNid });
}
