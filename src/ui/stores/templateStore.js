/**
 * @file templateStore.js
 * Estado do catálogo de templates — Zustand store.
 *
 * Gerencia:
 *   - Lista de templates/variações carregadas da API
 *   - Cache com TTL
 *   - Filtro de busca
 *   - Módulo selecionado para visualização
 */

import { create } from 'zustand';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

const useTemplateStore = create((set, get) => ({
  // ── Estado ──
  templates: [],          // Array de módulos com variações
  isLoading: false,
  error: null,
  searchQuery: '',
  typeFilter: '',         // Filtro por tipo de módulo
  selectedVariation: null, // Variação expandida
  lastFetched: null,       // Timestamp do último fetch

  // ── Ações ──
  setTemplates: (templates) => set({
    templates,
    lastFetched: Date.now(),
    isLoading: false,
    error: null,
  }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setTypeFilter: (typeFilter) => set({ typeFilter }),

  setSelectedVariation: (selectedVariation) => set({ selectedVariation }),

  /**
   * Verifica se o cache ainda é válido.
   */
  isCacheValid: () => {
    const { lastFetched } = get();
    if (!lastFetched) return false;
    return Date.now() - lastFetched < CACHE_TTL_MS;
  },

  /**
   * Retorna templates filtrados por busca e tipo.
   */
  getFilteredTemplates: () => {
    const { templates, searchQuery, typeFilter } = get();
    let filtered = templates;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.map((mod) => {
        const matchingVariations = mod.variations.filter((v) =>
          v.name.toLowerCase().includes(q) ||
          mod.module.toLowerCase().includes(q)
        );
        if (matchingVariations.length === 0) return null;
        return { ...mod, variations: matchingVariations };
      }).filter(Boolean);
    }

    if (typeFilter) {
      const tf = typeFilter.toLowerCase();
      filtered = filtered.filter((mod) =>
        mod.module.toLowerCase().includes(tf)
      );
    }

    return filtered;
  },

  clearCache: () => set({
    templates: [],
    lastFetched: null,
    selectedVariation: null,
  }),
}));

export default useTemplateStore;
