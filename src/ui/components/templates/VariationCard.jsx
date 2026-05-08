/**
 * @file VariationCard.jsx
 * Card expandível de uma variação de template.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FieldList from './FieldList';
import { Button } from '@/components/ui/button';
import { ChevronDown, Copy, Check, FileJson, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function VariationCard({ variation, onDownloadSchema }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [allCopied, setAllCopied] = useState(false);
  const [nameCopied, setNameCopied] = useState(false);

  const fieldCount = variation.fields?.length || 0;

  const typeCounts = {};
  (variation.fields || []).forEach((f) => {
    const t = f.type || 'TEXT';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const handleCopyAll = () => {
    const lines = (variation.fields || [])
      .map((f) => `${f.name}`)
      .join('\n');

    const header = `// Template: ${variation.name}\n// ${fieldCount} propriedades\n\n`;

    navigator.clipboard.writeText(header + lines).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = header + lines;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });

    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const handleCopyName = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(variation.name).catch(() => {});
    setNameCopied(true);
    setTimeout(() => setNameCopied(false), 1500);
  };

  return (
    <div className={`flex flex-col border rounded-[var(--radius-sm)] overflow-hidden transition-colors ${isExpanded ? 'border-brand bg-bg' : 'border-border bg-bg-secondary'}`}>
      <button
        className="flex items-center gap-3 p-3 w-full bg-transparent border-none text-left cursor-pointer outline-none hover:bg-black/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col flex-1 min-w-0 gap-1.5">
          <span className="text-xs font-bold text-text-primary truncate">{variation.name}</span>
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[9px] font-bold bg-black/20 text-text-secondary px-1.5 py-0.5 rounded uppercase tracking-[0.5px]">
              {fieldCount} campos
            </span>
            {Object.entries(typeCounts).map(([type, count]) => (
              <Badge 
                key={type} 
                variant={
                  type === 'TEXT' ? 'success' : 
                  type === 'BOOLEAN' ? 'info' : 
                  type === 'VARIANT' ? 'purple' : 
                  type === 'URL' ? 'warning' : 'muted'
                } 
                size="sm"
              >
                {count} {type.toLowerCase()}
              </Badge>
            ))}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform shrink-0 ${isExpanded ? 'rotate-180 text-brand' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
            className="flex flex-col px-3 pb-3 border-t border-border/50"
          >
            {/* Instruções */}
            <div className="flex flex-col gap-2 mt-3 mb-4 p-3 bg-brand-soft border border-brand/20 rounded-[var(--radius-sm)]">
              <div className="flex items-center gap-2 text-[11px] text-text-primary">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-brand text-white font-bold text-[9px] shrink-0">1</span>
                <span>Renomeie o Frame pai para:</span>
                <button 
                  className="flex items-center gap-1.5 ml-auto bg-black/20 hover:bg-black/40 border-none px-2 py-1 rounded cursor-pointer transition-colors outline-none group"
                  onClick={handleCopyName}
                  title="Copiar nome"
                >
                  <code className="font-mono text-[10px] font-bold text-brand group-hover:text-brand-hover">{variation.name}</code>
                  {nameCopied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-text-tertiary group-hover:text-text-secondary" />}
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-text-primary">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-brand text-white font-bold text-[9px] shrink-0">2</span>
                <span>Renomeie as layers internas com os nomes abaixo</span>
              </div>
            </div>

            {/* Preview Visual Real da API */}
            <div className="relative aspect-video mb-4 border border-border rounded-[var(--radius-sm)] overflow-hidden bg-black/20 group/img">
              <img 
                src={`https://tim-agentic-cms-api-dev.gentlebeach-a211275a.eastus.azurecontainerapps.io/api/screenshots/${variation.name}`}
                alt={variation.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden absolute inset-0 items-center justify-center gap-2 text-[10px] text-text-tertiary">
                <ImageIcon className="w-5 h-5 opacity-30" />
                <span>Sem preview disponível</span>
              </div>
            </div>

            <FieldList fields={variation.fields} />

            {(variation.nid_origem || variation.component_id) && (
              <div className="flex flex-col gap-1 mb-4 p-2.5 bg-black/10 rounded-[var(--radius-sm)] text-[10px] font-mono">
                {variation.component_id && (
                  <div className="flex">
                    <span className="w-[100px] text-text-secondary font-bold">Component ID:</span>
                    <span className="text-text-primary">{variation.component_id}</span>
                  </div>
                )}
                {variation.nid_origem && (
                  <div className="flex">
                    <span className="w-[100px] text-text-secondary font-bold">NID Origem:</span>
                    <span className="text-text-primary">{variation.nid_origem}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant={allCopied ? 'success' : 'primary'}
                className="flex-[2]"
                onClick={handleCopyAll}
              >
                {allCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copiar Todas as Props
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onDownloadSchema(variation)}
              >
                <FileJson className="w-3.5 h-3.5 mr-1.5" />
                Schema JSON
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
