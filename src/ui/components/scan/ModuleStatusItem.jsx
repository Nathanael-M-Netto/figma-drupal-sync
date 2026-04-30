/**
 * @file ModuleStatusItem.jsx
 * Item individual do relatório de scan com ícone de status.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  recognized: {
    icon: '✓',
    color: '#2ea043',
    bg: 'rgba(46, 160, 67, 0.1)',
    border: 'rgba(46, 160, 67, 0.3)',
    label: 'Reconhecido',
  },
  warning: {
    icon: '⚠',
    color: '#ffa500',
    bg: 'rgba(255, 165, 0, 0.1)',
    border: 'rgba(255, 165, 0, 0.3)',
    label: 'Atenção',
  },
  unknown: {
    icon: '✕',
    color: '#f85149',
    bg: 'rgba(248, 81, 73, 0.1)',
    border: 'rgba(248, 81, 73, 0.3)',
    label: 'Não reconhecido',
  },
};

export default function ModuleStatusItem({ module }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = STATUS_CONFIG[module.status] || STATUS_CONFIG.unknown;

  return (
    <div
      className="module-status-item"
      style={{ borderLeftColor: config.color, background: config.bg }}
    >
      <button
        className="module-status-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="module-status-icon" style={{ color: config.color }}>
          {config.icon}
        </span>
        <div className="module-status-info">
          <span className="module-status-name">{module.name}</span>
          <span className="module-status-label" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>
        {(module.message || module.missingFields?.length > 0) && (
          <svg
            className={`module-status-chevron ${isExpanded ? 'chevron-open' : ''}`}
            width="12" height="12" viewBox="0 0 12 12" fill="none"
          >
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (module.message || module.missingFields?.length > 0) && (
          <motion.div
            className="module-status-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {module.message && (
              <p className="module-status-message">{module.message}</p>
            )}
            {module.suggestion && (
              <div className="module-status-suggestion">
                <span className="suggestion-label">Sugestão:</span>
                <code>{module.suggestion}</code>
              </div>
            )}
            {module.missingFields?.length > 0 && (
              <div className="module-status-missing">
                <span className="missing-label">Campos faltando:</span>
                <div className="missing-list">
                  {module.missingFields.map((f) => (
                    <code key={f} className="missing-field">{f}</code>
                  ))}
                </div>
              </div>
            )}
            {module.data && Object.keys(module.data).length > 0 && (
              <div className="module-status-data">
                <span className="data-label">Dados extraídos: {Object.keys(module.data).length} campos</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
