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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tim-agentic-cms-api-dev.gentlebeach-a211275a.eastus.azurecontainerapps.io';

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
    const endpoint = `${API_BASE_URL}/api/templates/${encodeURIComponent(templateName)}`;
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
  // Se vier no formato { variants: [...] }, extrai o array
  const list = rawData.variants || (Array.isArray(rawData) ? rawData : [rawData]);

  // Se já vier como array de objetos com .module e .variations, retorna direto
  if (Array.isArray(list) && list[0]?.module && list[0]?.variations) {
    return list;
  }

  // Agrupa por módulo
  const moduleMap = new Map();

  for (const item of list) {
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
      fields: (() => {
        // Se figma_properties for um objeto (formato API), converte para array
        if (item.figma_properties && typeof item.figma_properties === 'object' && !Array.isArray(item.figma_properties)) {
          return Object.entries(item.figma_properties).map(([name, props]) => ({
            name,
            type: (props.type || 'TEXT').toUpperCase(),
            example: props.example || props.default_value || '',
            ...props
          }));
        }
        // Fallback para fields se já for array ou vazio
        return item.fields || Array.isArray(item.figma_properties) ? item.figma_properties : [];
      })(),
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
