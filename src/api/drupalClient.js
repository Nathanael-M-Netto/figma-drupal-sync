/**
 * @file drupalClient.js
 * Cliente de API otimizado para comunicação com o CMS Drupal.
 *
 * REGRA DE OURO (Performance):
 *   - GET (Sync): Uma ÚNICA chamada busca o JSON completo da página por NID
 *   - POST (Deploy): Uma ÚNICA chamada envia a árvore hierárquica inteira
 *   - Evita múltiplas requisições ao máximo
 *
 * Este módulo roda na UI (iframe), pois o sandbox do Figma
 * NÃO pode fazer requisições HTTP.
 */

const API_BASE_URL = 'https://tim-agentic-cms-api-dev.gentlebeach-a211275a.eastus.azurecontainerapps.io/api';

// ══════════════════════════════════════════════════════
// CLIENTE HTTP
// ══════════════════════════════════════════════════════

/**
 * Cria uma instância do cliente com a API Key configurada.
 *
 * @param {string} apiKey - Chave de autenticação X-TIM-Key
 * @returns {Object} Cliente com métodos deploy, sync, createPage, fetchSchema
 */
export function createDrupalClient(apiKey) {
  /**
   * Wrapper de fetch com headers padronizados e tratamento de erros.
   */
  async function request(endpoint, method = 'GET', body = null) {
    if (!apiKey) {
      throw new Error('API Key não configurada. Vá em Dev Settings para inserir.');
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    // Suporte híbrido v2 (API Key) e v3 (JWT)
    if (apiKey.startsWith('mock_jwt_') || apiKey.split('.').length === 3) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      headers['X-TIM-Key'] = apiKey;
    }

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[drupalClient] API ${response.status}:`, errorBody);
        throw new Error(
          `Status ${response.status}: ${errorBody || response.statusText}`
        );
      }

      return await response.json();
    } catch (err) {
      // Erro de rede (sem conexão, DNS, etc.)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Sem conexão com o servidor. Verifique sua rede.');
      }
      throw err;
    }
  }

  // ══════════════════════════════════════════════════════
  // ★ CHAMADA ÚNICA — DEPLOY (POST)
  // ══════════════════════════════════════════════════════

  /**
   * Envia a página inteira para o Drupal em UMA ÚNICA chamada.
   *
   * ★ CHAMADA ÚNICA DE API: Em vez de enviar módulo por módulo
   *   (N requisições), envia toda a árvore hierárquica em um único POST.
   *
   * @param {string} targetNid - NID da página no Drupal
   * @param {Array<{name: string, order: number, data: Object}>} modules - Árvore de módulos
   * @returns {Promise<Object>} Resposta da API
   */
  async function deployPage(targetNid, modules) {
    // Payload hierárquico: toda a página em um único JSON
    const payload = {
      target_nid: targetNid,
      modules: modules.map((mod) => ({
        module_name: mod.name,
        order: mod.order,
        data: mod.data,
      })),
    };

    return request('/figma/page', 'POST', payload);
  }

  /**
   * Deploy de um único módulo (fallback de compatibilidade).
   * Usado quando a API não suporta o payload hierárquico.
   *
   * @param {string} targetNid - NID da página
   * @param {string} moduleName - Nome do módulo
   * @param {Object} data - Dados do módulo
   * @returns {Promise<Object>}
   */
  async function deployModule(targetNid, moduleName, data) {
    const payload = {
      target_nid: targetNid,
      module_name: moduleName,
      data,
    };

    return request('/figma/page', 'POST', payload);
  }

  // ══════════════════════════════════════════════════════
  // ★ CHAMADA ÚNICA — SYNC (GET)
  // ══════════════════════════════════════════════════════

  /**
   * Busca o JSON completo da página no Drupal em UMA ÚNICA chamada.
   *
   * ★ CHAMADA ÚNICA DE API: Recebe todos os módulos da página
   *   de uma vez. A UI em React repassa para o backend do Figma,
   *   que aplica os valores em todos os nós correspondentes.
   *
   * @param {string} nid - NID da página
   * @param {string} [moduleName] - Nome do módulo (opcional, para filtrar)
   * @returns {Promise<Object>} JSON com dados da página
   */
  async function syncPage(nid, moduleName) {
    let endpoint = `/figma/pull/${nid}`;
    if (moduleName) {
      endpoint += `?module_name=${encodeURIComponent(moduleName)}`;
    }

    return request(endpoint, 'GET');
  }

  // ══════════════════════════════════════════════════════
  // CRIAR PÁGINA NOVA (POST sem NID)
  // ══════════════════════════════════════════════════════

  /**
   * Cria uma nova página no Drupal a partir dos dados do Figma.
   * A API gera o NID e retorna na resposta.
   *
   * @param {string} moduleName - Nome do módulo
   * @param {Object} data - Dados extraídos do Figma
   * @returns {Promise<Object>} Resposta com { new_nid }
   */
  async function createPage(moduleName, data) {
    const payload = {
      module_name: moduleName,
      data,
    };

    return request('/figma/page', 'POST', payload);
  }

  // ══════════════════════════════════════════════════════
  // SCHEMA
  // ══════════════════════════════════════════════════════

  /**
   * Busca o schema de um módulo na API.
   *
   * @param {string} moduleName - Nome do módulo
   * @returns {Promise<Object>} Schema do módulo
   */
  async function fetchSchema(moduleName) {
    const endpoint = `/figma/templates?module_name=${encodeURIComponent(moduleName)}`;
    const res = await request(endpoint, 'GET');
    // A API pode retornar o schema em diferentes formatos
    return res.figma_component_schema || res.schema || res;
  }

  return {
    deployPage,
    deployModule,
    syncPage,
    createPage,
    fetchSchema,
  };
}
