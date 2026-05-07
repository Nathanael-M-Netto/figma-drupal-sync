/**
 * @file TemplateList.jsx
 * Tela completa do catálogo de templates — MAPA DE REFERÊNCIA para DEVs.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplates } from '../../hooks/useTemplates';
import TemplateSearch from './TemplateSearch';
import VariationCard from './VariationCard';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronDown, Info, SearchX } from 'lucide-react';

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

  useEffect(() => {
    loadTemplates();
  }, []);

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

  const expandAll = () => {
    const all = new Set(filteredTemplates.map((m) => m.module));
    setExpandedModules(all);
  };
  const collapseAll = () => setExpandedModules(new Set());

  const totalVariations = filteredTemplates.reduce(
    (sum, mod) => sum + mod.variations.length,
    0
  );
  const totalProps = filteredTemplates.reduce(
    (sum, mod) => sum + mod.variations.reduce((vSum, v) => vSum + (v.fields?.length || 0), 0),
    0
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-5">
        <div className="p-8 text-center text-text-tertiary">
          <Progress value={100} variant="brand" label="Carregando catálogo de templates..." className="animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header com estatísticas */}
      <div className="flex justify-between items-center bg-bg border border-border rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex gap-4 items-center flex-1">
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-brand">{filteredTemplates.length}</span>
            <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-[0.5px]">Módulos</span>
          </div>
          <div className="w-[1px] h-6 bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-brand">{totalVariations}</span>
            <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-[0.5px]">Variações</span>
          </div>
          <div className="w-[1px] h-6 bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-brand">{totalProps}</span>
            <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-[0.5px]">Props</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0 ml-4">
          <Button variant="outline" size="sm" onClick={expandAll}>Expandir Todos</Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>Colapsar</Button>
        </div>
      </div>

      <TemplateSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
      />

      {error && (
        <div className="bg-danger-soft text-danger p-2.5 rounded-[var(--radius-sm)] text-[11px] font-medium border border-danger/20 mb-3">
          {error}
        </div>
      )}

      {/* Guia de uso */}
      <div className="flex items-start gap-2 bg-purple-soft text-purple border border-purple/20 p-3 rounded-[var(--radius-sm)] text-[11px] leading-relaxed">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Use este catálogo como referência para renomear suas layers no Figma. Clique em qualquer nome de propriedade para copiá-lo.</span>
      </div>

      <div className="flex flex-col gap-3 pb-5">
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-border rounded-[var(--radius-md)] bg-bg-secondary text-text-tertiary">
            <SearchX className="w-8 h-8 mb-3" />
            <p className="text-xs font-semibold mb-1 text-text-primary">Nenhum template encontrado</p>
            <p className="text-[11px]">Verifique sua conexão e API Key</p>
          </div>
        ) : (
          filteredTemplates.map((mod) => {
            const isExpanded = expandedModules.has(mod.module);
            const variationCount = mod.variations.length;
            const modPropCount = mod.variations.reduce(
              (sum, v) => sum + (v.fields?.length || 0),
              0
            );

            return (
              <div key={mod.module} className="bg-bg border border-border rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-sm)]">
                <button
                  className={`w-full flex items-center justify-between p-4 cursor-pointer text-left border-none outline-none transition-colors ${isExpanded ? 'bg-bg-secondary border-b border-border' : 'bg-transparent hover:bg-bg-hover'}`}
                  onClick={() => toggleModule(mod.module)}
                >
                  <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
                    <span className="text-[13px] font-bold text-text-primary truncate">{mod.module}</span>
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] bg-black/20 text-text-secondary px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                        {variationCount} {variationCount === 1 ? 'variação' : 'variações'}
                      </span>
                      <span className="text-[10px] bg-black/20 text-text-secondary px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                        {modPropCount} props
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180 text-brand' : ''}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="bg-bg-secondary p-4 flex flex-col gap-3"
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
