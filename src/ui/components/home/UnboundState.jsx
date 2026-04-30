/**
 * @file UnboundState.jsx
 * Estado "não vinculado" da tela Home — quando o NID não está definido.
 *
 * Mostra: card de aviso, campo para vincular NID, deploy para nova página.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function UnboundState({ onBind, onDeployNewPage, currentModuleName }) {
  const [nidInput, setNidInput] = useState('');

  return (
    <motion.div
      className="unbound-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Deploy Nova Página */}
      <div
        className="card glass-panel"
        style={{
          borderColor: 'var(--purple)',
          background: 'rgba(163, 113, 247, 0.03)',
        }}
      >
        <div className="section-title" style={{ color: 'var(--purple)' }}>
          Página Nova
        </div>
        <p
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
          }}
        >
          Crie uma nova página no Drupal com o conteúdo do Figma.
        </p>
        <button className="btn btn-deploy btn-lg" onClick={onDeployNewPage}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 4v6M4 7h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Deploy numa Página Nova
        </button>
      </div>

      {/* Vincular NID */}
      <div className="bind-area">
        <div className="bind-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M13.5 18.5l5-5M11.3 20.7a4.24 4.24 0 010-6l2.4-2.4a4.24 4.24 0 016 0M18.3 11.3a4.24 4.24 0 010 6l-2.4 2.4a4.24 4.24 0 01-6 0"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>Vincular Página Drupal</h2>
        <p>
          Insira o NID da página para conectar este arquivo Figma.
          Todos os deploys e syncs usarão esse vínculo automaticamente.
        </p>
        <div className="bind-card glass-panel">
          <div className="input-group" style={{ marginBottom: '12px' }}>
            <label>NID da Página</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ex: 140421"
              value={nidInput}
              onChange={(e) => setNidInput(e.target.value)}
              style={{
                fontSize: '16px',
                fontWeight: 600,
                textAlign: 'center',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
              }}
            />
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => {
              if (nidInput.trim()) {
                onBind(nidInput.trim());
                setNidInput('');
              }
            }}
          >
            Vincular e Continuar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
