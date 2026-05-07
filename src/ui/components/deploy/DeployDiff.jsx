/**
 * @file DeployDiff.jsx
 * Componente de diff visual campo a campo.
 */

import React, { useState } from 'react';
import { CheckSquare, Square, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG = {
  changed:   { label: 'Modificado', badge: 'warning', className: 'border-warning/30 bg-warning/5' },
  added:     { label: 'Novo',       badge: 'success', className: 'border-success/30 bg-success/5' },
  removed:   { label: 'Removido',   badge: 'danger',  className: 'border-danger/30 bg-danger/5' },
  unchanged: { label: 'Inalterado', badge: 'muted',   className: 'border-border bg-black/10 opacity-70' },
};

export default function DeployDiff({ diff, onToggleField }) {
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [excludedFields, setExcludedFields] = useState(new Set());

  if (!diff) return null;

  const handleToggle = (field) => {
    setExcludedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      if (onToggleField) onToggleField(field, !next.has(field));
      return next;
    });
  };

  const renderItems = (items, type) =>
    items.map((item) => {
      const config = STATUS_CONFIG[type];
      const isExcluded = excludedFields.has(item.field);

      return (
        <div
          key={item.field}
          className={`flex items-start gap-3 p-3 rounded-[var(--radius-sm)] border mb-2 transition-all duration-200 ${config.className} ${isExcluded ? 'opacity-40 saturate-0 scale-[0.99]' : ''}`}
        >
          <button 
            className="mt-0.5 bg-transparent border-none text-text-secondary cursor-pointer hover:text-brand transition-colors p-0 flex shrink-0"
            onClick={() => handleToggle(item.field)}
          >
            {!isExcluded ? <CheckSquare className="w-4 h-4 text-brand" /> : <Square className="w-4 h-4" />}
          </button>
          
          <div className="flex flex-col flex-1 gap-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-mono text-xs font-semibold ${isExcluded ? 'line-through' : 'text-text-primary'}`}>{item.field}</span>
              <Badge variant={config.badge} size="sm">{config.label}</Badge>
            </div>
            
            {type === 'changed' && (
              <div className="flex flex-col gap-1 mt-1 font-mono text-[10px] bg-black/20 p-2 rounded">
                <div className="flex items-start gap-2 text-text-tertiary line-through truncate">
                  <span className="shrink-0 w-6 text-right">-</span>
                  <span>{String(item.oldValue)}</span>
                </div>
                <div className="flex items-start gap-2 text-success truncate">
                  <span className="shrink-0 w-6 text-right">+</span>
                  <span>{String(item.newValue)}</span>
                </div>
              </div>
            )}
            {type === 'added' && (
              <div className="font-mono text-[10px] text-success bg-success/10 p-2 rounded truncate mt-1">
                + {String(item.newValue)}
              </div>
            )}
            {type === 'removed' && (
              <div className="font-mono text-[10px] text-danger line-through bg-danger/10 p-2 rounded truncate mt-1">
                - {String(item.oldValue)}
              </div>
            )}
            {type === 'unchanged' && (
              <div className="font-mono text-[10px] text-text-tertiary bg-black/10 p-2 rounded truncate mt-1">
                = {String(item.value)}
              </div>
            )}
          </div>
        </div>
      );
    });

  return (
    <div className="flex flex-col gap-3">
      {/* Resumo */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {diff.changed.length > 0 && (
          <Badge variant="warning">{diff.changed.length} modificado{diff.changed.length > 1 ? 's' : ''}</Badge>
        )}
        {diff.added.length > 0 && (
          <Badge variant="success">{diff.added.length} novo{diff.added.length > 1 ? 's' : ''}</Badge>
        )}
        {diff.removed.length > 0 && (
          <Badge variant="danger">{diff.removed.length} removido{diff.removed.length > 1 ? 's' : ''}</Badge>
        )}
        {diff.unchanged.length > 0 && (
          <button
            className="flex items-center gap-1.5 ml-auto text-[10px] font-bold uppercase tracking-[0.5px] text-text-tertiary hover:text-text-primary bg-transparent border-none cursor-pointer p-1"
            onClick={() => setShowUnchanged(!showUnchanged)}
          >
            {showUnchanged ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showUnchanged ? 'Ocultar' : 'Mostrar'} {diff.unchanged.length} inalterado{diff.unchanged.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="flex flex-col">
        {renderItems(diff.changed, 'changed')}
        {renderItems(diff.added, 'added')}
        {renderItems(diff.removed, 'removed')}
        {showUnchanged && renderItems(diff.unchanged, 'unchanged')}
      </div>
    </div>
  );
}
