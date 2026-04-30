/**
 * @file BoundState.jsx
 * Estado "vinculado" da tela Home — quando o NID está definido.
 *
 * Mostra: badge NID, módulo selecionado, preview de dados,
 * botões de Deploy, Sync, Templates, Download.
 */

import React from 'react';
import { motion } from 'framer-motion';
import NidBadge from '../NidBadge';
import PropertyList from '../PropertyList';
import useAppStore from '../../stores/appStore';
import useAuthStore from '../../stores/authStore';

export default function BoundState({
  linkedNid,
  currentModuleName,
  extractedData,
  currentMeta,
  onDeploy,
  onSync,
  onDownload,
}) {
  const navigate = useAppStore((s) => s.navigate);
  const isDevRole = useAuthStore((s) => s.user?.role === 'dev');
  const hasModule = !!currentModuleName;

  return (
    <motion.div
      className="glass-panel"
      style={{ padding: '16px', marginBottom: '16px' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Header com NID */}
      <div className="bound-header">
        <div className="label">Arquivo vinculado a</div>
        <NidBadge nid={linkedNid} />
      </div>

      {/* Módulo selecionado */}
      {hasModule && (
        <div className="module-chip">
          <span className="mc-label">MÓDULO</span>
          <input type="text" value={currentModuleName} readOnly />
        </div>
      )}

      {/* Preview de dados extraídos */}
      {hasModule && (
        <PropertyList data={extractedData} meta={currentMeta} />
      )}

      {!hasModule && (
        <div className="home-hint">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 15l-3-3m0 0l-3 3m3-3v9M4 6h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p>Selecione um módulo no Figma para ver os dados extraídos.</p>
        </div>
      )}

      {/* Ações principais */}
      <div className="bound-actions">
        <button className="btn btn-deploy btn-lg" onClick={onDeploy} disabled={!hasModule}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v9M4 7l3 3 3-3M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Deploy para o Drupal
        </button>

        <div className="flex-row">
          <button className="btn btn-primary" onClick={onSync}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7a6 6 0 0110.89-3.48M13 7a6 6 0 01-10.89 3.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M13 1v3h-3M1 13v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sync
          </button>
          <button className="btn btn-outline" onClick={() => navigate('scan')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 3.5V2a1 1 0 011-1h1.5M10.5 1H12a1 1 0 011 1v1.5M13 10.5V12a1 1 0 01-1 1h-1.5M3.5 13H2a1 1 0 01-1-1v-1.5"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Scan
          </button>
        </div>

        {isDevRole && (
          <div className="flex-row">
            <button className="btn btn-outline" onClick={() => navigate('templates')}>
              Templates
            </button>
            <button className="btn btn-outline" onClick={onDownload}>
              JSON
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
