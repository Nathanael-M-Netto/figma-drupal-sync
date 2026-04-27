/**
 * @file DesignerTab.jsx
 * Aba Designer — Interface para designers.
 *
 * Dois estados UX:
 *   - Unbound (sem NID): Mostra área de vincular + card "Página Nova"
 *   - Bound (com NID): Mostra preview + botões Deploy/Sync/Download
 */

import React, { useState } from 'react';
import NidBadge from './NidBadge';
import PropertyList from './PropertyList';
import StatusBar from './StatusBar';

export default function DesignerTab({
  linkedNid,
  currentModuleName,
  extractedData,
  currentMeta,
  onBind,
  onDeploy,
  onDeployNewPage,
  onSync,
  onDownload,
  status,
}) {
  const [nidInput, setNidInput] = useState('');

  const hasBound = !!linkedNid;
  const hasModule = !!currentModuleName;

  return (
    <div className={`tab-content active`}>

      {/* ── DEPLOY PÁGINA NOVA (aparece apenas sem NID) ── */}
      {!hasBound && (
        <div
          className="card"
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
            Crie uma nova página no Drupal com o conteúdo atual.
          </p>
          <button className="btn btn-deploy btn-lg" onClick={onDeployNewPage}>
            Deploy numa Página Nova
          </button>
        </div>
      )}

      {/* ── UNBOUND: Entrada do NID ── */}
      {!hasBound && (
        <div className="bind-area">
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              letterSpacing: '2px',
            }}
          >
            — —
          </div>
          <h2>Vincular Página Drupal</h2>
          <p>
            Insira o NID da página para conectar este arquivo Figma.
            Todos os deploys e syncs usarão esse vínculo automaticamente.
          </p>
          <div className="bind-card">
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
      )}

      {/* ── BOUND: Painel Principal ── */}
      {hasBound && (
        <div>
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

          {/* Ações principais */}
          <div className="bound-actions">
            <button className="btn btn-deploy btn-lg" onClick={onDeploy}>
              Deploy para o Drupal
            </button>
            <button className="btn btn-primary btn-lg" onClick={onSync}>
              Sync do Drupal
            </button>
            <button className="btn btn-outline" onClick={onDownload}>
              Baixar JSON (backup)
            </button>
          </div>
        </div>
      )}

      <StatusBar text={status.text} type={status.type} visible={status.visible} />
    </div>
  );
}
