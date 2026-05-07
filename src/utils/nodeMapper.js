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
  // Remove sufixos de device e também anotações entre chaves {}
  // Ex: "m01_hero {type: banner_destaque}" -> "m01_hero"
  return name.trim()
    .toLowerCase()
    .replace(/\{.*\}/, '') // Remove conteúdo entre chaves
    .trim()
    .replace(/(_desk|_desktop|_mobile|_mob)$/, '');
}

/**
 * Extrai metadados extras do nome da layer.
 * Ex: "MOD_BANNER {type: hero_home}" -> { paragraph_type: "hero_home" }
 */
export function extractMetadataFromName(name) {
  const meta = {};
  const match = name.match(/\{type:\s*([^}]+)\}/i);
  if (match) {
    meta.paragraph_type = match[1].trim().toLowerCase();
  }
  return meta;
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
    (n) => n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE' || n.type === 'GROUP'
  );

  // Ordena por posição Y (de cima para baixo na tela)
  const sorted = [...topFrames].sort((a, b) => a.y - b.y);

  const modules = [];
  const moduleMap = new Map();

  for (const frame of sorted) {
    const rawName = frame.name.trim().toLowerCase();
    const baseName = getBaseModuleName(rawName);

    // Permite qualquer frame top-level como potencial módulo.
    // A validação real acontecerá via cruzamento com o catálogo (scanValidator).

    const nodeMap = buildNodeMap([frame]);
    const data = extractDataFromNodeMap(nodeMap);
    const meta = extractMetadataFromName(frame.name);

    if (moduleMap.has(baseName)) {
      // Combina os dados com o módulo existente (ex: junta _mobile com o _desk)
      const existing = moduleMap.get(baseName);
      existing.data = { ...existing.data, ...data };
      existing.meta = { ...existing.meta, ...meta };
      
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
        meta,
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

    // Textos: verifica se o nome começa com TXT_, VAR_, URL_, etc (case insensitive)
    const upperName = name.toUpperCase();
    const isTextProp = upperName.startsWith('TXT_') || upperName.startsWith('URL_') || upperName.startsWith('VAR_') || upperName.startsWith('BOOL_');
    
    if (node.type === 'TEXT' && isTextProp) {
      let value = node.characters.trim();
      if (value.toLowerCase() === 'true') value = true;
      else if (value.toLowerCase() === 'false') value = false;
      // Mantém a chave original (name) para o Figma poder sincronizar depois
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
    
    // Busca no nodeMap ignorando case (ex: txt_titulo vs TXT_TITULO)
    let matchingNodes = [];
    for (const [key, nodes] of nodeMap.entries()) {
      if (key.toLowerCase() === prop.name.toLowerCase()) {
        matchingNodes.push(...nodes);
      }
    }

    if (prop.type === 'TEXT') {
      const textNodes = matchingNodes.filter((n) => n.type === 'TEXT');
      if (textNodes.length > 0) {
        let c = textNodes[0].characters.trim();
        if (c.toLowerCase() === 'true') c = true;
        else if (c.toLowerCase() === 'false') c = false;
        data[prop.name] = c;
        found = true;
      } else {
        // Fallback: busca em component properties
        const p = allProps.find((p) => p.cleanName.toLowerCase() === prop.name.toLowerCase() && p.type === 'TEXT');
        if (p) {
          data[prop.name] = p.value;
          found = true;
        }
      }
    } else if (prop.type === 'BOOLEAN') {
      const p = allProps.find((p) => p.cleanName.toLowerCase() === prop.name.toLowerCase() && p.type === 'BOOLEAN');
      if (p) {
        data[prop.name] = p.value;
        found = true;
      }
    } else if (prop.type === 'VARIANT') {
      // Cores
      if (prop.name.startsWith('VAR_CORES')) {
        const colorNodes = matchingNodes;
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

// ══════════════════════════════════════════════════════
// ★ PROPERTY LOADING & LINKING ENGINE (Fase 6)
// ══════════════════════════════════════════════════════

/**
 * Faz match do nome de um módulo no Figma contra o catálogo de templates da API.
 *
 * Suporta:
 *   - Match exato: "m01_hero_destaque_full_image_v01" → template correspondente
 *   - Match parcial: "m01_hero_destaque_full_image" → melhor variante
 *   - Match fuzzy por substrings compartilhadas
 *
 * @param {string} moduleName - Nome do frame/grupo no Figma (já normalizado)
 * @param {Array} templates - Array de templates da API no formato [{componentName, properties}]
 * @returns {{template: Object|null, score: number, matchType: string}}
 */
export function matchModuleToTemplate(moduleName, templates) {
  if (!moduleName || !templates || templates.length === 0) {
    return { template: null, score: 0, matchType: 'none' };
  }

  const normalized = moduleName.toLowerCase().trim()
    .replace(/(_desk|_desktop|_mobile|_mob)$/, '')
    .replace(/\{.*\}/, '').trim();

  let bestMatch = null;
  let bestScore = 0;
  let matchType = 'none';

  for (const tmpl of templates) {
    const tmplName = (tmpl.componentName || tmpl.module_name || '').toLowerCase().trim();

    // Match exato
    if (tmplName === normalized) {
      return { template: tmpl, score: 1.0, matchType: 'exact' };
    }

    // Match: um contém o outro
    if (normalized.includes(tmplName) || tmplName.includes(normalized)) {
      const score = Math.min(normalized.length, tmplName.length) / Math.max(normalized.length, tmplName.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = tmpl;
        matchType = 'contains';
      }
    }

    // Match fuzzy por segmentos _
    const partsA = normalized.split('_');
    const partsB = tmplName.split('_');
    let matches = 0;
    for (const part of partsA) {
      if (part.length > 1 && partsB.includes(part)) matches++;
    }
    const fuzzyScore = matches / Math.max(partsA.length, partsB.length);
    if (fuzzyScore > bestScore && fuzzyScore > 0.4) {
      bestScore = fuzzyScore;
      bestMatch = tmpl;
      matchType = 'fuzzy';
    }
  }

  return { template: bestMatch, score: bestScore, matchType };
}

/**
 * Identifica propriedades compartilhadas e exclusivas entre subcamadas Desktop e Mobile.
 *
 * Dentro de um grupo/módulo, pode haver:
 *   - Um frame/grupo "_desk" ou "_desktop"
 *   - Um frame/grupo "_mobile" ou "_mob"
 *
 * Props com o MESMO NOME em ambos devem ser linkadas a uma ÚNICA component property.
 * Props únicas permanecem individuais.
 *
 * @param {SceneNode} rootNode - Nó raiz do módulo
 * @returns {{
 *   deskNode: SceneNode|null,
 *   mobileNode: SceneNode|null,
 *   shared: Array<{name: string, deskNodes: SceneNode[], mobileNodes: SceneNode[]}>,
 *   deskOnly: Array<{name: string, nodes: SceneNode[]}>,
 *   mobileOnly: Array<{name: string, nodes: SceneNode[]}>,
 *   allProps: Array<{name: string, type: string, nodes: SceneNode[]}>
 * }}
 */
export function identifySharedProps(rootNode) {
  const result = {
    deskNode: null,
    mobileNode: null,
    shared: [],
    deskOnly: [],
    mobileOnly: [],
    allProps: [],
  };

  if (!rootNode || !('children' in rootNode)) return result;

  // Identifica subcamadas Desktop e Mobile
  for (const child of rootNode.children) {
    const childName = child.name.trim().toLowerCase();
    if (childName.match(/(_desk|_desktop)$/)) {
      result.deskNode = child;
    } else if (childName.match(/(_mobile|_mob)$/)) {
      result.mobileNode = child;
    }
  }

  // Se não encontrou separação desk/mobile, retorna tudo como "all"
  if (!result.deskNode && !result.mobileNode) {
    const allMap = buildPrefixedNodeMap([rootNode]);
    for (const [name, nodes] of allMap.entries()) {
      result.allProps.push({ name, type: inferPropType(name), nodes });
    }
    return result;
  }

  // Constrói mapas separados
  const deskMap = result.deskNode ? buildPrefixedNodeMap([result.deskNode]) : new Map();
  const mobileMap = result.mobileNode ? buildPrefixedNodeMap([result.mobileNode]) : new Map();

  const allNames = new Set([...deskMap.keys(), ...mobileMap.keys()]);

  for (const name of allNames) {
    const inDesk = deskMap.has(name);
    const inMobile = mobileMap.has(name);

    if (inDesk && inMobile) {
      result.shared.push({
        name,
        type: inferPropType(name),
        deskNodes: deskMap.get(name),
        mobileNodes: mobileMap.get(name),
      });
    } else if (inDesk) {
      result.deskOnly.push({
        name,
        type: inferPropType(name),
        nodes: deskMap.get(name),
      });
    } else {
      result.mobileOnly.push({
        name,
        type: inferPropType(name),
        nodes: mobileMap.get(name),
      });
    }
  }

  return result;
}

/**
 * Constrói um mapa de nós apenas com os que possuem prefixos reconhecidos.
 * Filtra apenas TEXT, INSTANCE, e nós com nome prefixado.
 *
 * @param {SceneNode[]} rootNodes
 * @returns {Map<string, SceneNode[]>}
 */
function buildPrefixedNodeMap(rootNodes) {
  const map = new Map();

  function walk(nodes) {
    for (const node of nodes) {
      const name = node.name.trim();
      const upper = name.toUpperCase();

      // Só inclui nós com prefixos reconhecidos
      const hasPrefixedName =
        upper.startsWith('TXT_') ||
        upper.startsWith('URL_') ||
        upper.startsWith('VAR_') ||
        upper.startsWith('BOOL_') ||
        upper.startsWith('MOD_') ||
        upper.startsWith('COMP_');

      if (hasPrefixedName && (node.type === 'TEXT' || node.type === 'INSTANCE')) {
        if (!map.has(name)) map.set(name, []);
        map.get(name).push(node);
      }

      if ('children' in node) walk(node.children);
    }
  }

  walk(rootNodes);
  return map;
}

/**
 * Infere o tipo de property (TEXT/BOOLEAN/VARIANT) pelo prefixo do nome.
 *
 * @param {string} name
 * @returns {string} 'TEXT' | 'BOOLEAN' | 'VARIANT'
 */
function inferPropType(name) {
  const upper = name.toUpperCase();
  if (upper.startsWith('BOOL_')) return 'BOOLEAN';
  if (upper.startsWith('VAR_')) return 'VARIANT';
  return 'TEXT';
}

/**
 * Gera relatório completo de scan da página comparando com catálogo de templates.
 *
 * @param {PageNode} page - Página do Figma
 * @param {Array} templates - Templates da API [{componentName, properties}]
 * @returns {Array<{
 *   name: string, nodeId: string, y: number,
 *   matchResult: {template, score, matchType},
 *   propsAnalysis: ReturnType<identifySharedProps>,
 *   expectedProps: number, foundProps: number
 * }>}
 */
export function buildFullPageScanReport(page, templates) {
  const modules = buildModuleTree(page);
  const report = [];

  for (const mod of modules) {
    // Match contra catálogo
    const matchResult = matchModuleToTemplate(mod.name, templates);

    // Análise de props Desktop/Mobile
    // Para obter o rootNode, buscamos nos filhos da página
    let rootNode = null;
    for (const child of page.children) {
      if (child.id === mod.nodeId) {
        rootNode = child;
        break;
      }
    }

    const propsAnalysis = rootNode ? identifySharedProps(rootNode) : {
      deskNode: null, mobileNode: null,
      shared: [], deskOnly: [], mobileOnly: [], allProps: [],
    };

    // Conta props esperadas vs encontradas
    const expectedProps = matchResult.template?.properties?.length || 0;
    const foundProps = propsAnalysis.shared.length
      + propsAnalysis.deskOnly.length
      + propsAnalysis.mobileOnly.length
      + propsAnalysis.allProps.length;

    report.push({
      name: mod.name,
      nodeId: mod.nodeId,
      y: mod.y,
      order: mod.order,
      data: mod.data,
      matchResult,
      propsAnalysis: {
        sharedCount: propsAnalysis.shared.length,
        deskOnlyCount: propsAnalysis.deskOnly.length,
        mobileOnlyCount: propsAnalysis.mobileOnly.length,
        allPropsCount: propsAnalysis.allProps.length,
        hasDesktopMobile: !!(propsAnalysis.deskNode || propsAnalysis.mobileNode),
        sharedNames: propsAnalysis.shared.map(s => s.name),
        deskOnlyNames: propsAnalysis.deskOnly.map(d => d.name),
        mobileOnlyNames: propsAnalysis.mobileOnly.map(m => m.name),
      },
      expectedProps,
      foundProps,
    });
  }

  return report;
}

