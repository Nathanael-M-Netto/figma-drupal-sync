/**
 * @file VariationCard.jsx
 * Card expandível de uma variação de template.
 * Mostra campos, botões de download schema/contrato.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FieldList from './FieldList';

export default function VariationCard({ variation, onDownloadSchema }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const fieldCount = variation.fields?.length || 0;

  return (
    <div className={`variation-card ${isExpanded ? 'variation-card-expanded' : ''}`}>
      <button
        className="variation-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="variation-info">
          <span className="variation-name">{variation.name}</span>
          <span className="variation-count">{fieldCount} campos</span>
        </div>
        <svg
          className={`variation-chevron ${isExpanded ? 'chevron-open' : ''}`}
          width="14" height="14" viewBox="0 0 14 14" fill="none"
        >
          <path d="M4 5.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="variation-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <FieldList fields={variation.fields} />

            {variation.nid_origem && (
              <div className="variation-meta">
                <span className="meta-label">NID Origem:</span>
                <span className="meta-value">{variation.nid_origem}</span>
              </div>
            )}

            <div className="variation-actions">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => onDownloadSchema(variation)}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v7M3 5l3 3 3-3M2 10h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Schema (Figma)
              </button>
              {variation.figma_component_schema && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(variation.figma_component_schema, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `component_schema_${variation.name}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Componente Schema
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
