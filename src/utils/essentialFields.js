/**
 * @file essentialFields.js
 * Mapeamento e auto-detecção de campos essenciais do Drupal no Figma.
 *
 * Define quais campos do content-type podem ser detectados
 * automaticamente a partir de layers nomeadas no Figma.
 *
 * Será atualizado quando o backend definir os campos essenciais na API.
 */

/**
 * Mapeamento de convenções de layer → campos do content-type Drupal.
 *
 * Chave: nome da layer no Figma (case-insensitive match).
 * Valor: campo do Drupal correspondente.
 */
export const ESSENTIAL_FIELD_MAP = {
  // Metatags / SEO
  'PAGE_TITLE':       'field_subtitle_metatag',
  'PAGE_DESCRIPTION': 'field_description_metatag',
  'PAGE_URL':         'title',
  'META_TITLE':       'field_subtitle_metatag',
  'META_DESCRIPTION': 'field_description_metatag',
  'SEO_TITLE':        'field_subtitle_metatag',

  // Content
  'NODE_TITLE':       'title',
  'NODE_STATUS':      'status',
  'NODE_PATH':        'path',

  // Tags
  'FIELD_TAG':        'field_tag',
  'FIELD_TAGS':       'field_tag',
};

/**
 * Tipos de campo esperados para cada campo essencial.
 */
export const ESSENTIAL_FIELD_TYPES = {
  'field_subtitle_metatag':    'string',
  'field_description_metatag': 'text_formatted',
  'title':                     'string',
  'status':                    'boolean',
  'path':                      'string',
  'field_tag':                 'list_string',
};

/**
 * Detecta campos essenciais a partir do nodeMap extraído do Figma.
 *
 * Percorre todos os nós e verifica se algum nome corresponde
 * a um campo essencial do mapeamento.
 *
 * @param {Object} nodeMap - Mapa de nós extraídos {nome: valor}
 * @param {Object|null} contentTypeSchema - Schema do content-type (opcional)
 * @returns {{
 *   autoFilled: Object,   // { drupalField: { value, source, confidence } }
 *   missing: string[],    // Lista de campos não encontrados
 *   suggestions: Array    // Sugestões de renomeação
 * }}
 */
export function detectEssentialFields(nodeMap, contentTypeSchema = null) {
  const autoFilled = {};
  const foundDrupalFields = new Set();
  const suggestions = [];

  // Percorre nós do Figma e tenta encontrar campos essenciais
  for (const [nodeName, nodeValue] of Object.entries(nodeMap)) {
    const upperName = nodeName.toUpperCase().trim();

    // Verifica no mapeamento
    if (ESSENTIAL_FIELD_MAP[upperName]) {
      const drupalField = ESSENTIAL_FIELD_MAP[upperName];
      autoFilled[drupalField] = {
        value: nodeValue,
        source: nodeName,
        confidence: 1.0,
      };
      foundDrupalFields.add(drupalField);
      continue;
    }

    // Fuzzy match: procura por substrings
    for (const [layerPattern, drupalField] of Object.entries(ESSENTIAL_FIELD_MAP)) {
      if (!foundDrupalFields.has(drupalField)) {
        if (upperName.includes(layerPattern) || layerPattern.includes(upperName)) {
          autoFilled[drupalField] = {
            value: nodeValue,
            source: nodeName,
            confidence: 0.7,
          };
          foundDrupalFields.add(drupalField);
        }
      }
    }
  }

  // Identifica campos faltantes
  const allEssentialFields = new Set(Object.values(ESSENTIAL_FIELD_MAP));
  const missing = [...allEssentialFields].filter((f) => !foundDrupalFields.has(f));

  // Se tem schema do content-type, gera sugestões de melhoria
  if (contentTypeSchema?.fields) {
    for (const field of contentTypeSchema.fields) {
      if (field.required && !foundDrupalFields.has(field.name)) {
        suggestions.push({
          drupalField: field.name,
          suggestion: `Adicione uma layer "${field.name.toUpperCase()}" no Figma`,
          type: field.type,
        });
      }
    }
  }

  return { autoFilled, missing, suggestions };
}

/**
 * Mescla campos auto-detectados com o formulário manual.
 *
 * @param {Object} autoFilled - Campos detectados pelo scan
 * @param {Object} manualValues - Valores preenchidos manualmente pelo usuário
 * @returns {Object} - Valores mesclados (manual tem prioridade)
 */
export function mergeEssentialFields(autoFilled, manualValues) {
  const merged = {};

  // Auto-filled primeiro
  for (const [field, info] of Object.entries(autoFilled)) {
    merged[field] = info.value;
  }

  // Manual sobrescreve
  for (const [field, value] of Object.entries(manualValues)) {
    if (value !== undefined && value !== null && value !== '') {
      merged[field] = value;
    }
  }

  return merged;
}
