/**
 * @file colorMap.js
 * Mapeamento de cores RGB do Figma → strings do Drupal.
 *
 * O Figma usa floats (0–1) para RGB. Este módulo converte para HEX
 * e traduz para as strings semânticas esperadas pelo CMS.
 */

// ══════════════════════════════════════════════════════
// TABELA DE MAPEAMENTO  HEX → String Drupal
// ══════════════════════════════════════════════════════
export const COLOR_MAP = {
  'FFFFFF': 'white',
  '000000': 'black',
  'F2F2F2': 'grey',
  '000A3D': 'dark_blue',
  '0041E6': 'blue',
  'FF0000': 'red',
};

/**
 * Converte valores RGB (0–1 float do Figma) para string HEX maiúscula.
 * @param {number} r - Red (0–1)
 * @param {number} g - Green (0–1)
 * @param {number} b - Blue (0–1)
 * @returns {string} Ex: "FF0000"
 */
export function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16).toUpperCase();
    return hex.length === 1 ? '0' + hex : hex;
  };
  return toHex(r) + toHex(g) + toHex(b);
}

/**
 * Extrai a cor mapeada de um nó do Figma.
 * Lê o primeiro fill sólido e traduz via COLOR_MAP.
 *
 * @param {SceneNode} node - Nó do Figma
 * @returns {string} String do Drupal (ex: "dark_blue") ou "cor_nao_mapeada_XXXXXX"
 */
export function extractMappedColor(node) {
  if ('fills' in node) {
    const fills = node.fills;
    if (fills && fills.length > 0 && fills[0].type === 'SOLID') {
      const { r, g, b } = fills[0].color;
      const hex = rgbToHex(r, g, b);
      return COLOR_MAP[hex] || `cor_nao_mapeada_${hex}`;
    }
  }
  return 'transparent';
}
