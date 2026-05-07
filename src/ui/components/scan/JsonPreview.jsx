/**
 * @file JsonPreview.jsx
 * Preview do JSON que será enviado no deploy.
 * Syntax highlighting básico + botão copiar.
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function JsonPreview({ data, title = 'Payload JSON' }) {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = jsonString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn('Não foi possível copiar para o clipboard');
    }
  };

  return (
    <div className="flex flex-col rounded-[var(--radius-sm)] border border-border bg-[#1e1e1e] overflow-hidden mt-2">
      <div className="flex justify-between items-center px-3 py-2 bg-black/40 border-b border-border/50">
        <span className="text-[10px] font-bold text-[#a8b2d1] uppercase tracking-[1px]">{title}</span>
        <button
          className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.5px] p-1 rounded bg-transparent border-none cursor-pointer transition-colors ${copied ? 'text-success' : 'text-text-tertiary hover:text-white'}`}
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copiar
            </>
          )}
        </button>
      </div>
      <pre className="p-3 m-0 overflow-x-auto text-[10px] font-mono text-[#a8b2d1] leading-[1.4]">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}
