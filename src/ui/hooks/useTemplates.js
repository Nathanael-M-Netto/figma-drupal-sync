/**
 * @file useTemplates.js
 * Hook para gerenciar o catálogo de templates.
 *
 * Faz fetch dos templates da API real com fallback mock.
 * Implementa cache com TTL de 1h.
 */

import { useCallback } from 'react';
import { fetchTemplates, fetchTemplateByName } from '../../api/templateClient';
import useTemplateStore from '../stores/templateStore';
import useAuthStore from '../stores/authStore';
import useAppStore from '../stores/appStore';

export function useTemplates(apiKeyParam) {
  const {
    templates,
    isLoading,
    error,
    searchQuery,
    typeFilter,
    selectedVariation,
    lastFetched,
  } = useTemplateStore();

  const setTemplates = useTemplateStore((s) => s.setTemplates);
  const setLoading = useTemplateStore((s) => s.setLoading);
  const setError = useTemplateStore((s) => s.setError);
  const setSearchQuery = useTemplateStore((s) => s.setSearchQuery);
  const setTypeFilter = useTemplateStore((s) => s.setTypeFilter);
  const setSelectedVariation = useTemplateStore((s) => s.setSelectedVariation);
  const isCacheValid = useTemplateStore((s) => s.isCacheValid);
  const getFilteredTemplates = useTemplateStore((s) => s.getFilteredTemplates);
  const clearCache = useTemplateStore((s) => s.clearCache);

  const sessionToken = useAuthStore((s) => s.token || '');
  const apiKey = apiKeyParam || sessionToken;
  const addToast = useAppStore((s) => s.addToast);

  /**
   * Carrega templates da API (respeita cache).
   */
  const loadTemplates = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isCacheValid()) {
      return templates;
    }

    setLoading(true);

    try {
      const data = await fetchTemplates(apiKey);
      setTemplates(data);
      return data;
    } catch (err) {
      setError(err.message);
      addToast({ type: 'error', message: 'Erro ao carregar templates: ' + err.message });
      return [];
    }
  }, [apiKey, isCacheValid, templates, setTemplates, setLoading, setError, addToast]);

  /**
   * Busca um template específico pelo nome da variação.
   */
  const loadVariation = useCallback(async (templateName) => {
    try {
      const data = await fetchTemplateByName(templateName, apiKey);
      return data;
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao buscar template: ' + err.message });
      return null;
    }
  }, [apiKey, addToast]);

  /**
   * Gera e baixa o schema JSON de uma variação para guiar renomeações no Figma.
   */
  const downloadSchema = useCallback((variation) => {
    const schema = {
      componentName: variation.name,
      component_id: variation.component_id,
      properties: (variation.fields || []).map((f) => ({
        name: f.name,
        type: f.type,
        ...(f.example && { example: f.example }),
        ...(f.children && {
          children: f.children.map((c) => ({ name: c.name, type: c.type })),
        }),
      })),
    };

    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_${variation.name}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({ type: 'success', message: `Schema de "${variation.name}" baixado!` });
  }, [addToast]);

  return {
    templates,
    isLoading,
    error,
    searchQuery,
    typeFilter,
    selectedVariation,
    lastFetched,
    filteredTemplates: getFilteredTemplates(),
    loadTemplates,
    loadVariation,
    downloadSchema,
    setSearchQuery,
    setTypeFilter,
    setSelectedVariation,
    clearCache,
  };
}
