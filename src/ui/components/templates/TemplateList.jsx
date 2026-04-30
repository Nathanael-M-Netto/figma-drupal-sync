/**
 * @file TemplateList.jsx
 * Tela completa do catálogo de templates.
 * Lista acordeão de módulos agrupados por tipo.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplates } from '../../hooks/useTemplates';
import TemplateSearch from './TemplateSearch';
import VariationCard from './VariationCard';
import ProgressBar from '../shared/ProgressBar';

export default function TemplateList({ apiKey }) {
  const {
    isLoading,
    error,
    searchQuery,
    typeFilter,
    filteredTemplates,
    loadTemplates,
    downloadSchema,
    setSearchQuery,
    setTypeFilter,
  } = useTemplates(apiKey);

  // Carrega templates ao montar
  useEffect(() => {
    loadTemplates();
  }, []);

  // Módulos expandidos
  const [expandedModules, setExpandedModules] = useState(new Set());

  const toggleModule = (moduleName) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleName)) {
        next.delete(moduleName);
      } else {
        next.add(moduleName);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="template-screen">
        <div className="loading-state">
          <ProgressBar indeterminate label="Carregando templates..." variant="brand" />
        </div>
      </div>
    );
  }

  return (
    <div className="template-screen">
      <TemplateSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
      />

      {error && (
        <div className="status-bar error" style={{ marginBottom: '12px' }}>
          {error}
        </div>
      )}

      <div className="template-list">
        {filteredTemplates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <rect x="18" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <rect x="4" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <rect x="18" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            </div>
            <p>Nenhum template encontrado</p>
          </div>
        ) : (
          filteredTemplates.map((mod) => {
            const isExpanded = expandedModules.has(mod.module);
            const variationCount = mod.variations.length;

            return (
              <div key={mod.module} className="module-group">
                <button
                  className={`module-group-header ${isExpanded ? 'module-group-open' : ''}`}
                  onClick={() => toggleModule(mod.module)}
                >
                  <div className="module-group-info">
                    <span className="module-group-name">{mod.module}</span>
                    <span className="module-group-count">
                      {variationCount} {variationCount === 1 ? 'variação' : 'variações'}
                    </span>
                  </div>
                  <svg
                    className={`module-group-chevron ${isExpanded ? 'chevron-open' : ''}`}
                    width="14" height="14" viewBox="0 0 14 14" fill="none"
                  >
                    <path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="module-group-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      {mod.variations.map((variation) => (
                        <VariationCard
                          key={variation.name}
                          variation={variation}
                          onDownloadSchema={downloadSchema}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
