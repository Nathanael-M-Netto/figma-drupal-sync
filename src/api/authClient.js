/**
 * @file authClient.js
 * Cliente de autenticação.
 *
 * Atualmente opera com MOCK local para simulação.
 * Quando o backend de auth estiver pronto, basta trocar USE_MOCK = false.
 *
 * Mock credentials:
 *   - UX/12345 → perfil UX Designer
 *   - DEV/12345 → perfil Desenvolvedor
 */

const USE_MOCK = true;

const API_BASE_URL = 'https://tim-agentic-cms-api-dev.gentlebeach-a211275a.eastus.azurecontainerapps.io';

// ══════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════

const MOCK_USERS = {
  'UX': {
    id: 1,
    name: 'Designer UX',
    email: 'ux@tim.com.br',
    role: 'ux',
  },
  'DEV': {
    id: 2,
    name: 'Developer',
    email: 'dev@tim.com.br',
    role: 'dev',
  },
};

const MOCK_PASSWORD = '12345';

function generateMockToken(user) {
  return `mock_jwt_${user.role}_${Date.now()}`;
}

// ══════════════════════════════════════════════════════
// AUTH CLIENT
// ══════════════════════════════════════════════════════

/**
 * Login com email/username e senha.
 *
 * @param {string} username - Username (UX ou DEV no mock)
 * @param {string} password - Senha
 * @returns {Promise<{token: string, user: Object}>}
 */
export async function login(username, password) {
  if (USE_MOCK) {
    // Simula delay de rede
    await new Promise((r) => setTimeout(r, 800));

    const key = username.toUpperCase().trim();
    const user = MOCK_USERS[key];

    if (!user || password !== MOCK_PASSWORD) {
      throw new Error('Credenciais inválidas. Verifique usuário e senha.');
    }

    return {
      token: generateMockToken(user),
      user: { ...user },
    };
  }

  // ── Implementação real (quando backend estiver pronto) ──
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Erro ${response.status}`);
  }

  return response.json();
}

/**
 * Refresh do token JWT.
 *
 * @param {string} token - Token atual
 * @returns {Promise<{token: string}>}
 */
export async function refreshToken(token) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return { token: `mock_jwt_refreshed_${Date.now()}` };
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Sessão expirada. Faça login novamente.');
  return response.json();
}

/**
 * Logout.
 *
 * @param {string} token - Token atual
 */
export async function logout(token) {
  if (USE_MOCK) return;

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Ignora erros de logout
  }
}

/**
 * Verifica se um token é válido.
 * No mock, verifica apenas se começa com 'mock_jwt_'.
 *
 * @param {string} token
 * @returns {boolean}
 */
export function isTokenValid(token) {
  if (!token) return false;
  if (USE_MOCK) return token.startsWith('mock_jwt_');
  // TODO: verificar expiração do JWT real
  return true;
}
