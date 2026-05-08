/**
 * @file pageDiffer.js
 * Diff field-a-field entre dados do Figma e do Drupal.
 */

/**
 * Compara dados de um módulo Figma vs Drupal campo a campo.
 *
 * @param {Object} figmaData - Dados extraídos do Figma
 * @param {Object} drupalData - Dados atuais no Drupal
 * @returns {{ changed, added, removed, unchanged }}
 */
export function diffModuleData(figmaData, drupalData) {
  const fd = figmaData || {};
  const dd = drupalData || {};
  const changed = [];
  const added = [];
  const removed = [];
  const unchanged = [];

  const allKeys = new Set([...Object.keys(fd), ...Object.keys(dd)]);

  for (const key of allKeys) {
    const inFigma = key in fd;
    const inDrupal = key in dd;

    if (inFigma && inDrupal) {
      const figmaVal = fd[key];
      const drupalVal = dd[key];
      if (String(figmaVal) !== String(drupalVal)) {
        changed.push({ field: key, figmaValue: figmaVal, drupalValue: drupalVal });
      } else {
        unchanged.push({ field: key, value: figmaVal });
      }
    } else if (inFigma) {
      added.push({ field: key, figmaValue: fd[key] });
    } else {
      removed.push({ field: key, drupalValue: dd[key] });
    }
  }

  return { changed, added, removed, unchanged };
}

/**
 * Diff de página inteira — retorna diff por módulo.
 *
 * @param {Array} figmaModules - [{name, data}]
 * @param {Array} drupalModules - [{module_name, data}]
 * @returns {Array<{name, isNew, diff}>}
 */
export function diffPage(figmaModules, drupalModules) {
  const drupalByName = new Map((drupalModules || []).map((d) => [d.module_name, d]));
  return (figmaModules || []).map((fm) => {
    const dm = drupalByName.get(fm.name);
    return {
      name: fm.name,
      isNew: !dm,
      diff: diffModuleData(fm.data, dm?.data),
    };
  });
}
