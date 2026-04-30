/**
 * @file JsonPreview.jsx
 * Preview do JSON que será enviado no deploy.
 * Syntax highlighting básico + botão copiar.
 */

import React, { useState } from 'react';

export default function JsonPreview({ data, title = 'Payload JSON' }) {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      // No contexto do Figma plugin, navigator.clipboard pode não funcionar
      // Usa fallback com textarea
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
    <div className="json-preview">
      <div className="json-preview-header">
        <span className="json-preview-title">{title}</span>
        <button
          className={`json-preview-copy ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copiado!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8 4V2.5A1.5 1.5 0 006.5 1h-4A1.5 1.5 0 001 2.5v4A1.5 1.5 0 002.5 8H4" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Copiar
            </>
          )}
        </button>
      </div>
      <pre className="json-preview-code">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}
