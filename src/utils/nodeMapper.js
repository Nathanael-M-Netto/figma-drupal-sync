/**
 * @file nodeMapper.js
 * ★ MULTI-MAPEAMENTO DE NÓS DO FIGMA ★
 *
 * Este é o módulo que resolve o problema Desktop/Mobile.
 *
 * PROBLEMA ORIGINAL:
 *   Se existem dois nós com o mesmo nome (ex: TXT_TITULO no Desktop
 *   e TXT_TITULO no Mobile), o findOne() retornava apenas o primeiro.
 *   O segundo era silenciosamente ignorado.
 *
 * SOLUÇÃO:
 *   buildNodeMap() usa findAll() e agrupa TODOS os nós pelo nome
 *   em um Map<string, SceneNode[]>. Assim:
 *     TXT_TITULO → [TextNode(Desktop), TextNode(Mobile)]
 *
 *   Quando um valor precisa ser aplicado (ex: Sync do Drupal),
 *   applyValueToNodes() itera sobre o array inteiro, atualizando
 *   TODOS os nós que compartilham aquele nome.
 */

import { extractMappedColor } from './colorMap.js';

// ══════════════════════════════════════════════════════
// ★ MULTI-MAPEAMENTO: Agrupa nós por nome em arrays
// ══════════════════════════════════════════════════════

/**
 * Percorre recursivamente a árvore de nós e agrupa todos por nome.
 *
 * @param {SceneNode[]} rootNodes - Nós raiz para percorrer
 * @returns {Map<string, SceneNode[]>} Mapa nome → array de nós
 *
 * ★ MULTI-MAPEAMENTO: Cada nome pode ter MÚLTIPLOS nós (Desktop + Mobile)
 */
export function buildNodeMap(rootNodes) {
  const map = new Map();

  function walk(nodes) {
    for (const node of nodes) {
      const name = node.name.trim();
      if (name) {
        // ★ Agrupa em array — se já existe, adiciona; se não, cria array novo
        if (!map.has(name)) {
          map.set(name, []);
        }
        map.get(name).push(node);
      }
      if ('children' in node) {
        walk(node.children);
      }
    }
  }

  walk(rootNodes);
  return map;
}

// ══════════════════════════════════════════════════════
// LEITURA HIERÁRQUICA DE MÓDULOS
// ══════════════════════════════════════════════════════

export function getBaseModuleName(name) {
  return name.trim().toLowerCase().replace(/(_desk|_desktop|_mobile|_mob)$/, '');
}

/**
 * Lê a página inteira do Figma e retorna uma árvore hierárquica
 * de módulos, na ORDEM VISUAL (sorted by Y position, top → bottom).
 *
 * Módulos com sufixos (_desk, _mobile) são combinados em um único módulo
 * caso compartilhem o mesmo nome base.
 *
 * @param {PageNode} page - Página atual do Figma
 * @returns {Array<{name: string, order: number, nodeMap: Map, data: Object}>}
 */
export function buildModuleTree(page) {
  const topFrames = page.children.filter(
    (n) => n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE'
  );

  // Ordena por posição Y (de cima para baixo na tela)
  const sorted = [...topFrames].sort((a, b) => a.y - b.y);

  const modules = [];
  const moduleMap = new Map();

  for (const frame of sorted) {
    const rawName = frame.name.trim().toLowerCase();
    const baseName = getBaseModuleName(rawName);

    // Considera apenas nós que parecem ser módulos
    if (!baseName.startsWith('mod_') && !baseName.startsWith('comp_') && !baseName.startsWith('modulo_')) {
      continue;
    }

    const nodeMap = buildNodeMap([frame]);
    const data = extractDataFromNodeMap(nodeMap);

    if (moduleMap.has(baseName)) {
      // Combina os dados com o módulo existente (ex: junta _mobile com o _desk)
      const existing = moduleMap.get(baseName);
      existing.data = { ...existing.data, ...data };
      
      // Combina os nós no nodeMap para aplicar valores corretamente no sync
      for (const [k, v] of nodeMap.entries()) {
        if (!existing.nodeMap.has(k)) {
          existing.nodeMap.set(k, []);
        }
        existing.nodeMap.get(k).push(...v);
      }
    } else {
      const newModule = {
        name: baseName,
        order: modules.length,
        y: frame.y,
        nodeId: frame.id,
        nodeMap,
        data,
      };
      modules.push(newModule);
      moduleMap.set(baseName, newModule);
    }
  }

  return modules;
}

/**
 * Extrai dados (textos, booleans, variantes, cores) de um nodeMap.
 * Usado tanto no modo livre quanto no modo com schema.
 *
 * @param {Map<string, SceneNode[]>} nodeMap - Mapa de nós agrupados
 * @returns {Object} Dados extraídos {key: value}
 */
export function extractDataFromNodeMap(nodeMap) {
  const data = {};

  for (const [name, nodes] of nodeMap.entries()) {
    const node = nodes[0]; // Usa o primeiro nó como referência de valor

    // Textos: nomes em CAIXA_ALTA com underscore
    if (node.type === 'TEXT' && name === name.toUpperCase() && name.includes('_')) {
      let value = node.characters.trim();
      if (value.toLowerCase() === 'true') value = true;
      else if (value.toLowerCase() === 'false') value = false;
      data[name] = value;
    }

    // Componentes: prefixo MOD_ ou COMP_
    if (
      node.type === 'INSTANCE' &&
      (name.startsWith('MOD_') || name.startsWith('COMP_') || name.toLowerCase().includes('botao'))
    ) {
      const props = node.componentProperties;
      const el = {};
      let hasProps = false;

      for (const [k, p] of Object.entries(props)) {
        if (p.type === 'VARIANT' || p.type === 'BOOLEAN' || p.type === 'TEXT') {
          el[k.split('#')[0].trim()] = p.value;
          hasProps = true;
        }
      }
      if (hasProps) data[name] = el;
    }

    // Cores: prefixo VAR_CORES
    if (name.startsWith('VAR_CORES')) {
      data[name] = extractMappedColor(node);
    }
  }

  return data;
}

/**
 * Extrai dados usando um schema como guia (modo guiado).
 *
 * @param {Map<string, SceneNode[]>} nodeMap - Mapa de nós
 * @param {Object} schema - Schema do módulo ({componentName, properties})
 * @returns {{data: Object, meta: Object}}
 */
export function extractWithSchema(nodeMap, schema) {
  const data = {};
  const meta = {};

  // Coleta todas as component properties de instâncias
  const allProps = [];
  for (const [, nodes] of nodeMap.entries()) {
    for (const node of nodes) {
      if (node.type === 'INSTANCE' && node.componentProperties) {
        for (const [rawKey, prop] of Object.entries(node.componentProperties)) {
          allProps.push({
            cleanName: rawKey.split('#')[0].trim(),
            type: prop.type,
            value: prop.value,
          });
        }
      }
    }
  }

  const propertiesList = schema.properties || schema.schema?.properties || [];
  for (const prop of propertiesList) {
    if (prop.type === 'SLOT') continue;

    let found = false;

    if (prop.type === 'TEXT') {
      // Busca TextNode pelo nome
      const textNodes = (nodeMap.get(prop.name) || []).filter((n) => n.type === 'TEXT');
      if (textNodes.length > 0) {
        let c = textNodes[0].characters.trim();
        if (c.toLowerCase() === 'true') c = true;
        else if (c.toLowerCase() === 'false') c = false;
        data[prop.name] = c;
        found = true;
      } else {
        // Fallback: busca em component properties
        const p = allProps.find((p) => p.cleanName === prop.name && p.type === 'TEXT');
        if (p) {
          data[prop.name] = p.value;
          found = true;
        }
      }
    } else if (prop.type === 'BOOLEAN') {
      const p = allProps.find((p) => p.cleanName === prop.name && p.type === 'BOOLEAN');
      if (p) {
        data[prop.name] = p.value;
        found = true;
      }
    } else if (prop.type === 'VARIANT') {
      // Cores
      if (prop.name.startsWith('VAR_CORES')) {
        const colorNodes = nodeMap.get(prop.name);
        if (colorNodes && colorNodes.length > 0) {
          data[prop.name] = extractMappedColor(colorNodes[0]);
          found = true;
        }
      }
      // Fallback: busca em component properties
      if (!found) {
        const p = allProps.find(
          (p) => p.cleanName === prop.name && (p.type === 'VARIANT' || p.type === 'TEXT')
        );
        if (p) {
          data[prop.name] = p.value;
          found = true;
        }
      }
    }

    if (!found) data[prop.name] = null;
    meta[prop.name] = { type: prop.type, found };
  }

  return { data, meta };
}

// ══════════════════════════════════════════════════════
// ★ APLICAÇÃO DE VALORES EM MÚLTIPLOS NÓS
// ══════════════════════════════════════════════════════

/**
 * Aplica um valor a TODOS os nós que compartilham o mesmo nome.
 *
 * ★ MULTI-MAPEAMENTO: Se existem 2 nós "TXT_TITULO" (Desktop e Mobile),
 *   ambos serão atualizados com o novo valor.
 *
 * @param {TextNode} node - Nó de texto a atualizar
 * @param {string} value - Novo valor
 * @returns {Promise<boolean>} true se atualizado com sucesso
 */
export async function applyTextToNode(node, value) {
  try {
    if (node.type !== 'TEXT') return false;

    // Carrega fontes necessárias
    if (node.fontName !== figma.mixed) {
      await figma.loadFontAsync(node.fontName);
    } else {
      // Fontes mistas: carrega cada fonte individualmente
      const len = node.characters.length;
      for (let i = 0; i < len; i++) {
        const fn = node.getRangeFontName(i, i + 1);
        await figma.loadFontAsync(fn);
      }
    }

    node.characters = String(value);
    return true;
  } catch (err) {
    console.error(`[nodeMapper] Erro ao atualizar nó "${node.name}":`, err);
    return false;
  }
}
