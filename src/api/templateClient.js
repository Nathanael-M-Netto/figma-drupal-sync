/**
 * @file templateClient.js
 * Cliente de API para catálogo de templates/variações.
 *
 * Endpoints reais:
 *   GET /api/variants/templates — lista todas as variantes
 *   GET /api/variants/templates/{template_name} — template específico
 *
 * Inclui fallback mock para desenvolvimento offline.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

// Flag para forçar mock (útil para dev sem backend)
const FORCE_MOCK = false;

// ══════════════════════════════════════════════════════
// MOCK DATA (usado como fallback quando a API não responde)
// ══════════════════════════════════════════════════════

const MOCK_TEMPLATES = [];

// ══════════════════════════════════════════════════════
// API CLIENT
// ══════════════════════════════════════════════════════

/**
 * Busca todos os templates/variações.
 *
 * @param {string} [apiKey] - API Key ou token para autenticação
 * @param {string} [componentId] - Filtrar por component_id
 * @returns {Promise<Array>} Lista de módulos com variações
 */
export async function fetchTemplates(apiKey, componentId = '') {
  // Mock removido, agora sempre usa a API real

  try {
    let endpoint = `${API_BASE_URL}/api/templates`;
    if (componentId) {
      endpoint += `?component_id=${encodeURIComponent(componentId)}`;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      if (apiKey.startsWith('mock_jwt_') || apiKey.split('.').length === 3) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers['X-CMS-Key'] = apiKey;
      }
    }

    const response = await fetch(endpoint, { headers });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();

    // Normaliza a resposta para o formato interno
    return normalizeTemplateResponse(data);
  } catch (err) {
    console.error('[templateClient] Erro ao buscar templates:', err.message);
    throw err;
  }
}

/**
 * Busca um template específico pelo nome.
 *
 * @param {string} templateName - Nome da variação (ex: m01_hero_destaque_full_image_v04)
 * @param {string} [apiKey] - API Key ou token
 * @returns {Promise<Object>} Template completo com drupal_skeleton
 */
export async function fetchTemplateByName(templateName, apiKey) {
  // Mock removido, agora sempre usa a API real

  try {
    const endpoint = `${API_BASE_URL}/api/templates/${encodeURIComponent(templateName)}`;
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      if (apiKey.startsWith('mock_jwt_') || apiKey.split('.').length === 3) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers['X-CMS-Key'] = apiKey;
      }
    }

    const response = await fetch(endpoint, { headers });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = await response.json();
    return data.template || data;
  } catch (err) {
    console.error('[templateClient] Erro ao buscar template:', err.message);
    throw err;
  }
}

/**
 * Normaliza a resposta da API para formato interno consistente.
 * A API pode retornar um array flat de variantes ou agrupado por módulo.
 *
 * @param {Array|Object} rawData - Dados brutos da API
 * @returns {Array} Formato normalizado: [{ module, variations: [...] }]
 */
function normalizeTemplateResponse(rawData) {
  // Suporte a v2 (templates) e v1 (variants)
  const list = rawData.templates || rawData.variants || (Array.isArray(rawData) ? rawData : [rawData]);

  // Se já vier como array de objetos com .module e .variations, retorna direto
  if (Array.isArray(list) && list[0]?.module && list[0]?.variations) {
    return list;
  }

  // Agrupa por módulo
  const moduleMap = new Map();

  for (const item of list) {
    // module_name é o identificador técnico canônico (ex: m13_conjunto_cta_padrao).
    // Default mode da API v2 retorna { componentName, properties }; variants_only=true retorna { module_name, component_title, ... }.
    const moduleName = item.module_name || item.componentName || item.name || 'Módulo sem nome';
    const variantName = item.variant_id || item.template_name || moduleName;

    // Título humanizado: prefere component_title da API, fallback para humanizeModuleName(module_name)
    const humanTitle = item.component_title || humanizeModuleName(moduleName);
    const groupKey = moduleName;

    if (!moduleMap.has(groupKey)) {
      moduleMap.set(groupKey, {
        module: groupKey,
        moduleName,
        title: humanTitle,
        variations: [],
      });
    }

    moduleMap.get(groupKey).variations.push({
      name: moduleName,
      variantId: item.variant_id || null,
      title: humanTitle,
      component_id: item.component_id || '',
      nid_origem: item.nid_origem || null,
      fields: (() => {
        // 1. Suporte a figma_properties (objeto chave-valor v2)
        if (item.figma_properties && typeof item.figma_properties === 'object' && !Array.isArray(item.figma_properties)) {
          return Object.entries(item.figma_properties).map(([name, props]) => ({
            name,
            type: (props.type || 'TEXT').toUpperCase(),
            example: props.example || props.default_value || '',
            ...props
          }));
        }
        // 2. Suporte a figma_component_schema (array v2)
        if (item.figma_component_schema?.properties) {
          return item.figma_component_schema.properties;
        }
        // 3. Fallback para v1 ou campos já normalizados
        return item.fields || (Array.isArray(item.figma_properties) ? item.figma_properties : []);
      })(),
      figma_component_schema: item.figma_component_schema || null,
      drupal_skeleton: item.drupal_skeleton || null,
      metadata: item.metadata || null,
    });
  }

  // Converte para array e ordena alfabeticamente pelo module_name (ordem natural numérica para m01, m02, m13...)
  return Array.from(moduleMap.values()).sort((a, b) =>
    a.moduleName.localeCompare(b.moduleName, undefined, { numeric: true, sensitivity: 'base' })
  );
}

/**
 * Extrai o nome do módulo base a partir do nome de variação.
 * Ex: "m01_hero_destaque_full_image_v04" → "m01_hero"
 */
function extractModuleName(variantName) {
  if (!variantName) return 'Outros';
  const normalized = variantName.toLowerCase().trim();
  // Tenta capturar o padrão mXX_nome (ex: m01_hero) ignorando sufixos como _v04 ou _padrao
  const match = normalized.match(/^(m\d+_[a-z0-9]+(_[a-z0-9]+)?)/);
  if (match) return match[1];

  // Fallback: remove sufixos de versão comuns
  return normalized.replace(/(_v\d+|_padrao|_desk|_mobile|_mob)$/g, '') || 'Outros';
}

/**
 * Converte module_name técnico em título humanizado.
 * Ex: "m13_conjunto_cta_padrao" → "Conjunto CTA Padrão"
 *     "m05_faq_sanfona"          → "FAQ Sanfona"
 */
export function humanizeModuleName(moduleName) {
  if (!moduleName) return 'Outros';
  const ACRONYMS = new Set(['cta', 'faq', 'cms', 'tim', 'seo', 'b2b', 'b2c', 'api', 'url']);
  const stripped = moduleName.toLowerCase().replace(/^m\d+_/, '');
  const words = stripped.split('_').filter(Boolean);
  return words
    .map((w) => {
      if (ACRONYMS.has(w)) return w.toUpperCase();
      // Restaura acentos comuns que se perdem em slugs
      const accentMap = { padrao: 'Padrão', acao: 'Ação', sancao: 'Sanção' };
      if (accentMap[w]) return accentMap[w];
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}
