/**
 * @file scanValidator.js
 * Validação de nomenclatura de layers do Figma.
 *
 * Regras de prefixo:
 *   TXT_  → Texto editável
 *   VAR_  → Variante (enum)
 *   URL_  → URL de imagem/link
 *   SLOT_ → Agrupador estrutural
 *   MOD_  → Frame de módulo
 *   COMP_ → Componente interno
 *   BOOL_ → Toggle booleano
 */

/**
 * Prefixos válidos reconhecidos pelo plugin.
 */
export const VALID_PREFIXES = ['TXT_', 'VAR_', 'URL_', 'SLOT_', 'MOD_', 'COMP_', 'BOOL_'];

/**
 * Valida o nome de uma layer.
 *
 * @param {string} layerName - Nome da layer
 * @returns {{valid: boolean, prefix: string|null, suggestion: string|null}}
 */
export function validateLayerName(layerName) {
  const name = layerName.trim();

  // Verifica se tem prefixo válido
  for (const prefix of VALID_PREFIXES) {
    if (name.startsWith(prefix)) {
      return { valid: true, prefix, suggestion: null };
    }
  }

  // Tenta sugerir correção
  const upperName = name.toUpperCase();
  for (const prefix of VALID_PREFIXES) {
    if (upperName.startsWith(prefix)) {
      return {
        valid: false,
        prefix: null,
        suggestion: upperName, // Sugere versão em maiúscula
      };
    }
  }

  // Heurísticas de correção
  if (name.toLowerCase().startsWith('texto') || name.toLowerCase().includes('text')) {
    return { valid: false, prefix: null, suggestion: `TXT_${name.toUpperCase().replace(/\s+/g, '_')}` };
  }
  if (name.toLowerCase().startsWith('cor') || name.toLowerCase().includes('color')) {
    return { valid: false, prefix: null, suggestion: `VAR_CORES_${name.toUpperCase().replace(/\s+/g, '_')}` };
  }
  if (name.toLowerCase().includes('imagem') || name.toLowerCase().includes('image')) {
    return { valid: false, prefix: null, suggestion: `URL_${name.toUpperCase().replace(/\s+/g, '_')}` };
  }

  return { valid: false, prefix: null, suggestion: null };
}

/**
 * Valida um módulo completo contra o catálogo de templates.
 *
 * @param {Object} figmaModule - Módulo do Figma { name, data }
 * @param {Array} catalogTemplates - Templates do catálogo
 * @returns {{status: string, match: Object|null, missingFields: Array, extraFields: Array}}
 */
export function validateModuleAgainstCatalog(figmaModule, catalogTemplates) {
  const moduleName = figmaModule.name.toLowerCase().trim();

  // Busca match no catálogo
  let bestMatch = null;
  for (const mod of catalogTemplates) {
    for (const variation of mod.variations) {
      const vName = variation.name.toLowerCase().trim();
      const compId = (variation.component_id || '').toLowerCase().trim();

      if (vName === moduleName || compId === moduleName) {
        bestMatch = variation;
        break;
      }
    }
    if (bestMatch) break;
  }

  if (!bestMatch) {
    return { status: 'unknown', match: null, missingFields: [], extraFields: [] };
  }

  // Compara campos
  const expectedFields = new Set((bestMatch.fields || []).map((f) => f.name.toUpperCase()));
  const actualFields = new Set(Object.keys(figmaModule.data || {}).map((k) => k.toUpperCase()));

  const missingFields = [...expectedFields].filter((f) => !actualFields.has(f));
  const extraFields = [...actualFields].filter((f) => !expectedFields.has(f));

  const status = missingFields.length > 0 ? 'warning' : 'recognized';

  return { status, match: bestMatch, missingFields, extraFields };
}

/**
 * Gera relatório de scan completo.
 *
 * @param {Array} figmaModules - Módulos encontrados no Figma
 * @param {Array} catalogTemplates - Templates do catálogo
 * @returns {{recognized: Array, warnings: Array, unknown: Array, summary: Object}}
 */
export function generateScanReport(figmaModules, catalogTemplates) {
  const recognized = [];
  const warnings = [];
  const unknown = [];

  for (const mod of figmaModules) {
    const result = validateModuleAgainstCatalog(mod, catalogTemplates);

    const entry = {
      ...mod,
      ...result,
    };

    if (result.status === 'recognized') {
      recognized.push(entry);
    } else if (result.status === 'warning') {
      entry.message = `Campos faltando: ${result.missingFields.join(', ')}`;
      warnings.push(entry);
    } else {
      entry.message = 'Módulo não encontrado no catálogo de templates.';
      unknown.push(entry);
    }
  }

  return {
    recognized,
    warnings,
    unknown,
    summary: {
      total: figmaModules.length,
      ok: recognized.length,
      warn: warnings.length,
      fail: unknown.length,
    },
  };
}
