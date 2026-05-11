/**
 * @file drupalClient.js
 * Cliente de API para comunicação com o CMS Drupal.
 *
 * Estratégia de deploy (per API spec):
 *   - Mode 2 (template_name + data): uma chamada por módulo Figma.
 *   - Mode 3 (modules array) só processa o primeiro item — não usar para multi-módulo.
 *   - Módulos com source='drupal' (não tocados pelo designer) são ignorados no deploy
 *     pois já existem no Drupal e chamadas individuais não os sobrescrevem.
 *
 * env_host e env são injetados em todos os payloads PUT/POST que os aceitam.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';
const DEFAULT_ENV = 'ambiteste';

/**
 * Cria uma instância do cliente com autenticação e configurações de ambiente.
 *
 * @param {string} apiKey - X-TIM-Key ou Bearer JWT
 * @param {Object} [envConfig] - { envHost, env }
 */
export function createDrupalClient(apiKey, { envHost = '', env = DEFAULT_ENV } = {}) {
  async function request(endpoint, method = 'GET', body = null) {
    if (!apiKey) {
      throw new Error('API Key não configurada. Vá em Dev Settings para inserir.');
    }

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey.startsWith('mock_jwt_') || apiKey.split('.').length === 3) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      headers['X-CMS-Key'] = apiKey;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[drupalClient] API ${response.status}:`, errorBody);
        throw new Error(`Status ${response.status}: ${errorBody || response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Sem conexão com o servidor. Verifique sua rede.');
      }
      throw err;
    }
  }

  // ──────────────────────────────────────────────────────
  // Helpers internos
  // ──────────────────────────────────────────────────────

  function withEnv(payload) {
    if (envHost) payload.env_host = envHost;
    if (env) payload.env = env;
    return payload;
  }

  // ──────────────────────────────────────────────────────
  // DEPLOY
  // ──────────────────────────────────────────────────────

  /**
   * Deploya TODOS os módulos da página para o Drupal (Figma + Drupal-preserved).
   *
   * CRITICAL: every PUT /canvas replaces the full canvas. Sending a subset wipes
   * modules not included. Always send all modules (sorted by order) so Drupal-only
   * modules are preserved and the final canvas is the full merged page.
   *
   * @param {string} targetNid
   * @param {Array<{name, data, order, source}>} modules - ALL page modules, pre-merged
   * @param {{ onProgress?: Function }} [options]
   */
  async function deployPage(targetNid, modules, { onProgress } = {}) {
    const allModules = [...(modules || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (allModules.length === 0) {
      return { status: 'success', message: 'Nenhum módulo para enviar.' };
    }

    let lastResult = null;
    for (let i = 0; i < allModules.length; i++) {
      const mod = allModules[i];
      const payload = withEnv({
        template_name: mod.name,
        data: mod.data || {},
      });
      lastResult = await request(`/api/nodes/${targetNid}/canvas`, 'PUT', payload);
      if (onProgress) onProgress(i + 1, allModules.length, mod.name);
    }

    return lastResult;
  }

  /**
   * Deploy de um único módulo (usado no Dev Settings e home).
   */
  async function deployModule(targetNid, moduleName, data) {
    return request(`/api/nodes/${targetNid}/canvas`, 'PUT', withEnv({
      template_name: moduleName,
      data: data || {},
    }));
  }

  // ──────────────────────────────────────────────────────
  // SYNC
  // ──────────────────────────────────────────────────────

  /**
   * Busca o payload atual da página no Drupal.
   * Sem module_name → lista completa: { status, modules: [{module_name, data}] }
   * Com module_name → módulo único: { status, data }
   */
  async function syncPage(nid, moduleName) {
    let endpoint = `/api/nodes/${nid}/sync-payload`;
    if (moduleName) endpoint += `?module_name=${encodeURIComponent(moduleName)}`;
    return request(endpoint, 'GET');
  }

  // ──────────────────────────────────────────────────────
  // CRIAR PÁGINA
  // ──────────────────────────────────────────────────────

  async function createPage(moduleName, data) {
    return request('/api/pages', 'POST', withEnv({
      target_nid: null,
      module_name: moduleName,
      data: data || {},
    }));
  }

  // ──────────────────────────────────────────────────────
  // SCHEMA
  // ──────────────────────────────────────────────────────

  async function fetchSchema(moduleName) {
    const res = await request(`/api/templates/${encodeURIComponent(moduleName)}`, 'GET');
    return res.template?.figma_component_schema || res.template || res;
  }

  // ──────────────────────────────────────────────────────
  // NODE INFO
  // ──────────────────────────────────────────────────────

  async function getNodeContentType(nid) {
    return request(`/api/nodes/${nid}`, 'GET');
  }

  async function getContentTypeSchema(contentType) {
    return request(`/api/content-types/${contentType}`, 'GET');
  }

  // ──────────────────────────────────────────────────────
  // JOB POLLING (para deploys async futuros)
  // ──────────────────────────────────────────────────────

  async function pollJob(jobId, intervalMs = 2000, maxAttempts = 30) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, intervalMs));
      const result = await request(`/api/jobs/${jobId}`, 'GET');
      if (result.status === 'done') return result;
      if (result.status === 'failed') throw new Error(result.error || 'Job falhou no servidor.');
    }
    throw new Error('Timeout aguardando conclusão do job.');
  }

  return {
    deployPage,
    deployModule,
    syncPage,
    createPage,
    fetchSchema,
    getNodeContentType,
    getContentTypeSchema,
    pollJob,
  };
}
