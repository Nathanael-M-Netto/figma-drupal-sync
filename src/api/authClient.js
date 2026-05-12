/**
 * @file authClient.js
 * Cliente de autenticação.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Troca uma role name por um objeto de permissões similar ao mock anterior
 * (Simplificado por agora, ou decodificado de JWT se houver tempo).
 */
function parseTokenRole(token) {
  // Retorno provisório enquanto não parseia claims reais. 
  // O backend devolve "email", "name". Role precisara de claims do EntraID
  return 'dev'; 
}

/**
 * Valida sessão com token contra backend
 */
export async function fetchProfile(token) {
    // Por enquanto, podemos só retornar mock profile se o token existir
    // Mas idealmente o backend teria um endpoint /me
    return {
        id: 1,
        name: 'Usuário',
        email: 'user@example.com',
        role: parseTokenRole(token),
    };
}
