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
    // Na v2, temos component_title (ex: "Conjunto CTA") que é a família ideal.
    // template_name é o ID único da variação. v01, v02 etc costumam vir no variant_id ou no final do nome.
    const variantName = item.variant_id || item.template_name || item.name || item.componentName || 'Variação sem nome';
    
    // Tenta: component_title -> extractModuleName(variantName) -> "Outros"
    const groupName = item.component_title || extractModuleName(variantName || item.module_name || '');

    if (!moduleMap.has(groupName)) {
      moduleMap.set(groupName, {
        module: groupName,
        variations: [],
      });
    }

    moduleMap.get(groupName).variations.push({
      name: variantName,
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

  // Converte para array e ordena alfabeticamente pelo nome do módulo/família
  return Array.from(moduleMap.values()).sort((a, b) => 
    a.module.localeCompare(b.module, undefined, { numeric: true, sensitivity: 'base' })
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
