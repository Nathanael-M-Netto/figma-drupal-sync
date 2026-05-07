/**
 * @file FieldList.jsx
 * Lista de campos de uma variação de template.
 * Serve como GUIA DE REFERÊNCIA para o dev saber
 * exatamente como nomear cada layer no Figma.
 */

import React, { useState } from 'react';
import { Type, ToggleLeft, Palette, Link as LinkIcon, Package, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TYPE_CONFIG = {
  TEXT:    { icon: Type,       label: 'Text',    badge: 'success' },
  BOOLEAN: { icon: ToggleLeft, label: 'Bool',    badge: 'info' },
  VARIANT: { icon: Palette,    label: 'Variant', badge: 'purple' },
  URL:     { icon: LinkIcon,   label: 'URL',     badge: 'warning' },
  SLOT:    { icon: Package,    label: 'Slot',    badge: 'muted' },
};

function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState(null);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return { copiedKey, copy };
}

function FieldItem({ field, depth = 0, copiedKey, onCopy, index }) {
  const config = TYPE_CONFIG[field.type] || TYPE_CONFIG.TEXT;
  const itemKey = `${field.name}-${index}`;
  const isCopied = copiedKey === itemKey;
  const Icon = config.icon;

  return (
    <>
      <div 
        className="flex items-center gap-2 p-2 border-b border-border/50 text-[11px] last:border-b-0 hover:bg-black/5 transition-colors group"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <div className="w-[85px] shrink-0">
          <Badge variant={config.badge} size="sm" className="flex items-center gap-1 w-fit">
            <Icon className="w-3 h-3" />
            {config.label}
          </Badge>
        </div>

        <button
          className="flex-1 flex items-center gap-2 bg-transparent border-none outline-none cursor-pointer text-left overflow-hidden group-hover:text-brand"
          onClick={() => onCopy(field.name, itemKey)}
          title={isCopied ? 'Copiado!' : `Clique para copiar: ${field.name}`}
        >
          <span className={`font-mono font-bold truncate transition-colors ${isCopied ? 'text-success' : 'text-text-primary group-hover:text-brand'}`}>
            {field.name}
          </span>
          <div className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isCopied ? 'opacity-100 text-success' : 'text-text-tertiary'}`}>
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </div>
        </button>

        {field.example != null && (
          <div className="w-[120px] shrink-0 text-text-tertiary truncate font-mono text-[10px] bg-black/10 px-1.5 py-0.5 rounded" title={String(field.example)}>
            {typeof field.example === 'boolean'
              ? field.example ? 'true' : 'false'
              : String(field.example)}
          </div>
        )}
      </div>

      {Array.isArray(field.children) && field.children.map((child, i) => (
        <FieldItem
          key={`${child.name}-${i}`}
          field={child}
          depth={depth + 1}
          copiedKey={copiedKey}
          onCopy={onCopy}
          index={`${index}-${i}`}
        />
      ))}
    </>
  );
}

export default function FieldList({ fields, compact = false }) {
  const { copiedKey, copy } = useCopyToClipboard();

  if (!fields || fields.length === 0) {
    return (
      <div className="p-4 text-center text-[11px] text-text-tertiary bg-black/10 rounded-[var(--radius-sm)] border border-dashed border-border mb-3">
        Nenhum campo definido para esta variação
      </div>
    );
  }

  return (
    <div className={`flex flex-col border border-border rounded-[var(--radius-sm)] overflow-hidden bg-bg mb-3 ${compact ? 'text-[10px]' : ''}`}>
      <div className="flex items-center gap-2 px-2 py-2.5 bg-black/40 border-b border-border/50 text-[10px] font-bold uppercase tracking-[1px] text-text-tertiary">
        <span className="w-[85px] shrink-0 pl-2">Tipo</span>
        <span className="flex-1">Nome da Layer (clique p/ copiar)</span>
        <span className="w-[120px] shrink-0">Exemplo</span>
      </div>
      <div className="flex flex-col">
        {fields.map((field, i) => (
          <FieldItem
            key={`${field.name}-${i}`}
            field={field}
            copiedKey={copiedKey}
            onCopy={copy}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
