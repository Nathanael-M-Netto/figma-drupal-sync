/**
 * @file PropertyList.jsx
 * Renderiza a lista de propriedades extraídas com badges de tipo.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function PropertyList({ data, meta }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto mb-3.5 pr-1">
        <div className="flex items-center justify-center p-2 rounded text-[11px] font-medium bg-black/15 text-text-tertiary">
          Nenhum dado extraído
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto mb-3.5 pr-1">
      {Object.entries(data).map(([key, value]) => {
        const m = meta ? meta[key] : null;
        const isMissing = m && !m.found;

        let display;
        if (value === null) display = '[N/A]';
        else if (typeof value === 'object') display = JSON.stringify(value);
        else display = String(value);

        return (
          <div key={key} className="flex items-center gap-2 p-2 rounded bg-black/15 text-[11px] font-medium">
            {m && (
              <Badge 
                variant={
                  m.type === 'image' ? 'purple' : 
                  m.type === 'boolean' ? 'warning' : 
                  m.type === 'color' ? 'success' : 'default'
                } 
                size="sm"
              >
                {m.type}
              </Badge>
            )}
            <div className="flex-1 truncate">
              <span className="text-text-secondary font-semibold mr-1">{key}:</span>{' '}
              <span className={`font-mono ${isMissing ? 'text-danger line-through opacity-70' : 'text-text-primary'}`}>
                {display}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
