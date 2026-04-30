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

const API_BASE_URL = 'https://tim-agentic-cms-api-dev.gentlebeach-a211275a.eastus.azurecontainerapps.io/api';

// Flag para forçar mock (útil para dev sem backend)
const FORCE_MOCK = false;

// ══════════════════════════════════════════════════════
// MOCK DATA (usado como fallback quando a API não responde)
// ══════════════════════════════════════════════════════

const MOCK_TEMPLATES = [
  {
    module: 'm01_hero',
    variations: [
      {
        name: 'm01_hero_destaque_full_image_v04',
        component_id: 'cpt_m1_hero_destaque_full_image',
        nid_origem: 137026,
        fields: [
          { name: 'TXT_TITLE', type: 'TEXT', example: '<p>Título Principal</p>' },
          { name: 'TXT_SUBTITLE', type: 'TEXT', example: '<p>Subtítulo descritivo</p>' },
          { name: 'VAR_COLOR_SCHEME', type: 'VARIANT', example: 'dark-blue-style' },
          { name: 'URL_DESKTOP_SOURCE', type: 'URL', example: 'https://cdn.tim.com.br/hero-desktop.jpg' },
          { name: 'URL_MOBILE_SOURCE', type: 'URL', example: 'https://cdn.tim.com.br/hero-mobile.jpg' },
          { name: 'BOOL_PHOTO_CIRCLE', type: 'BOOLEAN', example: true },
          {
            name: 'SLOT_ITEMS', type: 'SLOT', children: [
              { name: 'URL_ITEMS_IMAGEM', type: 'URL', example: 'https://cdn.tim.com.br/item.jpg' },
              { name: 'TXT_ITEMS_ALT', type: 'TEXT', example: 'Descrição da imagem' },
            ],
          },
        ],
      },
    ],
  },
  {
    module: 'm02_cards',
    variations: [
      {
        name: 'm02_cards_grid_v01',
        component_id: 'cpt_m2_cards_grid',
        nid_origem: 137030,
        fields: [
          { name: 'TXT_SECTION_TITLE', type: 'TEXT', example: '<p>Nossos Planos</p>' },
          { name: 'VAR_LAYOUT', type: 'VARIANT', example: 'grid-3-cols' },
          { name: 'BOOL_SHOW_PRICES', type: 'BOOLEAN', example: true },
          {
            name: 'SLOT_CARDS', type: 'SLOT', children: [
              { name: 'TXT_CARD_TITLE', type: 'TEXT', example: 'TIM Pré' },
              { name: 'TXT_CARD_PRICE', type: 'TEXT', example: 'R$ 15,99/mês' },
              { name: 'URL_CARD_IMAGE', type: 'URL', example: 'https://cdn.tim.com.br/card.jpg' },
            ],
          },
        ],
      },
    ],
  },
  {
    module: 'm03_banner',
    variations: [
      {
        name: 'm03_banner_cta_v02',
        component_id: 'cpt_m3_banner_cta',
        nid_origem: 137035,
        fields: [
          { name: 'TXT_HEADLINE', type: 'TEXT', example: '<p>Oferta Exclusiva</p>' },
          { name: 'TXT_CTA_TEXT', type: 'TEXT', example: 'Assine Agora' },
          { name: 'URL_CTA_LINK', type: 'URL', example: 'https://tim.com.br/assine' },
          { name: 'VAR_COLOR_SCHEME', type: 'VARIANT', example: 'blue-gradient' },
          { name: 'URL_BG_IMAGE', type: 'URL', example: 'https://cdn.tim.com.br/banner-bg.jpg' },
        ],
      },
    ],
  },
];

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
    let endpoint = `${API_BASE_URL}/variants/templates`;
    if (componentId) {
      endpoint += `?component_id=${encodeURIComponent(componentId)}`;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      if (apiKey.startsWith('mock_jwt_') || apiKey.split('.').length === 3) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers['X-TIM-Key'] = apiKey;
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
    const endpoint = `${API_BASE_URL}/variants/templates/${encodeURIComponent(templateName)}`;
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      if (apiKey.startsWith('mock_jwt_') || apiKey.split('.').length === 3) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers['X-TIM-Key'] = apiKey;
      }
    }

    const response = await fetch(endpoint, { headers });

    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }

    return response.json();
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
  // Se já vier como array de objetos com .module e .variations, retorna direto
  if (Array.isArray(rawData) && rawData[0]?.module && rawData[0]?.variations) {
    return rawData;
  }

  // Se vier como array flat de variantes, agrupa por módulo
  const items = Array.isArray(rawData) ? rawData : [rawData];
  const moduleMap = new Map();

  for (const item of items) {
    // Extrai nome do módulo a partir do nome da variante ou component_id
    const variantName = item.name || item.module_name || item.template_name || '';
    const moduleName = extractModuleName(variantName);

    if (!moduleMap.has(moduleName)) {
      moduleMap.set(moduleName, {
        module: moduleName,
        variations: [],
      });
    }

    moduleMap.get(moduleName).variations.push({
      name: variantName,
      component_id: item.component_id || '',
      nid_origem: item.nid_origem || null,
      fields: item.figma_properties || item.fields || [],
      figma_component_schema: item.figma_component_schema || null,
      drupal_skeleton: item.drupal_skeleton || null,
      metadata: item.metadata || null,
    });
  }

  return Array.from(moduleMap.values());
}

/**
 * Extrai o nome do módulo base a partir do nome de variação.
 * Ex: "m01_hero_destaque_full_image_v04" → "m01_hero"
 */
function extractModuleName(variantName) {
  const normalized = variantName.toLowerCase().trim();
  // Tenta capturar o padrão mXX_nome
  const match = normalized.match(/^(m\d+_[a-z]+)/);
  if (match) return match[1];
  // Fallback: usa os primeiros 2 segmentos
  const parts = normalized.split('_');
  return parts.slice(0, 2).join('_') || 'unknown';
}
