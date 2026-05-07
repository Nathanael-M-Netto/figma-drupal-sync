/**
 * @file ModuleStatusItem.jsx
 * Item individual do relatório de scan com ícone de status.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';

const STATUS_CONFIG = {
  recognized: {
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/5',
    border: 'border-success/30',
    label: 'Reconhecido',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/5',
    border: 'border-warning/30',
    label: 'Atenção',
  },
  unknown: {
    icon: XCircle,
    color: 'text-danger',
    bg: 'bg-danger/5',
    border: 'border-danger/30',
    label: 'Não reconhecido',
  },
};

export default function ModuleStatusItem({ module }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = STATUS_CONFIG[module.status] || STATUS_CONFIG.unknown;
  const Icon = config.icon;
  const hasDetails = module.message || module.missingFields?.length > 0;

  return (
    <div className={`flex flex-col rounded-[var(--radius-sm)] border-l-2 border-y border-r transition-colors ${config.border} ${config.bg} mb-2`}>
      <button
        className={`flex items-center gap-2 p-3 bg-transparent border-none w-full text-left cursor-pointer outline-none transition-colors hover:bg-black/5 ${!hasDetails ? 'cursor-default hover:bg-transparent' : ''}`}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        disabled={!hasDetails}
      >
        <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[11px] font-bold text-text-primary truncate">{module.name}</span>
          <span className={`text-[9px] font-semibold uppercase tracking-[0.5px] ${config.color}`}>
            {config.label}
          </span>
        </div>
        {hasDetails && (
          <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            className="flex flex-col gap-2 p-3 pt-0 text-[11px]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {module.message && (
              <p className="text-text-secondary italic m-0">{module.message}</p>
            )}
            {module.suggestion && (
              <div className="flex flex-col gap-1 mt-1">
                <span className="font-semibold text-text-primary">Sugestão:</span>
                <code className="bg-black/20 p-1.5 rounded font-mono text-[10px] text-brand">{module.suggestion}</code>
              </div>
            )}
            {module.missingFields?.length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                <span className="font-semibold text-text-primary">Campos faltando:</span>
                <div className="flex flex-wrap gap-1">
                  {module.missingFields.map((f) => (
                    <code key={f} className="bg-danger/10 text-danger p-1 rounded font-mono text-[10px]">{f}</code>
                  ))}
                </div>
              </div>
            )}
            {module.data && Object.keys(module.data).length > 0 && (
              <div className="mt-1 pt-2 border-t border-black/10">
                <span className="text-text-tertiary font-semibold text-[10px] uppercase">Dados extraídos: {Object.keys(module.data).length} campos</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
