/**
 * @file PropertyLoadingWizard.jsx
 * UI wizard para o fluxo de setup inicial de propriedades.
 *
 * Etapas:
 *   1. Escaneando Figma com progress bar
 *   2. Lista de módulos encontrados com match de template
 *   3. Resumo de props que serão criadas (shared vs únicas)
 *   4. Botão "Carregar Propriedades" → executa a injeção
 *   5. Resultado — "X props criadas, Y links Desktop↔Mobile"
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressBar from '../shared/ProgressBar';
import { postToFigma } from '../../hooks/useFigmaMessages';
import useAppStore from '../../stores/appStore';

const STEPS = ['scan', 'review', 'loading', 'done'];

export default function PropertyLoadingWizard({ templates, onClose }) {
  const [step, setStep] = useState('idle');
  const [scanReport, setScanReport] = useState([]);
  const [result, setResult] = useState(null);
  const addToast = useAppStore((s) => s.addToast);

  // Escuta respostas do sandbox
  useEffect(() => {
    function handleMessage(event) {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === 'scan-report-result') {
        setScanReport(msg.report || []);
        setStep('review');
      } else if (msg.type === 'scan-load-done') {
        setResult({
          report: msg.report || [],
          totalPropsCreated: msg.totalPropsCreated || 0,
          totalLinksCreated: msg.totalLinksCreated || 0,
        });
        setStep('done');
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  /**
   * Step 1: Inicia o scan somente-leitura para ver o que será carregado.
   */
  const startScan = useCallback(() => {
    setStep('scan');
    // Converte templates para o formato que o sandbox espera
    const templateList = templates.flatMap((mod) =>
      (mod.variations || []).map((v) => ({
        componentName: v.name,
        module_name: mod.module,
        properties: v.fields || [],
      }))
    );
    postToFigma({ type: 'full-page-scan-report', templates: templateList });
  }, [templates]);

  /**
   * Step 3: Executa o carregamento real de propriedades.
   */
  const executeLoad = useCallback(() => {
    setStep('loading');
    const templateList = templates.flatMap((mod) =>
      (mod.variations || []).map((v) => ({
        componentName: v.name,
        module_name: mod.module,
        properties: v.fields || [],
      }))
    );
    postToFigma({ type: 'scan-and-load-props', templates: templateList });
  }, [templates]);

  // Conta estatísticas do scan
  const matched = scanReport.filter((r) => r.matchType !== 'none');
  const unmatched = scanReport.filter((r) => r.matchType === 'none');
  const totalShared = matched.reduce(
    (sum, r) => sum + (r.propsAnalysis?.sharedCount || 0),
    0
  );
  const totalExclusive = matched.reduce(
    (sum, r) =>
      sum +
      (r.propsAnalysis?.deskOnlyCount || 0) +
      (r.propsAnalysis?.mobileOnlyCount || 0) +
      (r.propsAnalysis?.allPropsCount || 0),
    0
  );

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h3>Setup de Propriedades</h3>
        <p className="wizard-desc">
          Escaneia o Figma, identifica módulos, e carrega as propriedades no painel lateral.
        </p>
      </div>

      {/* ── IDLE: Botão inicial ── */}
      {step === 'idle' && (
        <div className="wizard-body">
          <div className="wizard-steps-preview">
            <div className="wizard-step-preview">
              <span className="step-num">1</span>
              <span>Escanear página para identificar módulos</span>
            </div>
            <div className="wizard-step-preview">
              <span className="step-num">2</span>
              <span>Revisar matches com o catálogo de templates</span>
            </div>
            <div className="wizard-step-preview">
              <span className="step-num">3</span>
              <span>Carregar propriedades no Figma (Component Properties)</span>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={startScan}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Iniciar Scan
          </button>
        </div>
      )}

      {/* ── SCANNING ── */}
      {step === 'scan' && (
        <div className="wizard-body">
          <ProgressBar indeterminate label="Escaneando página do Figma..." variant="brand" />
          <p className="wizard-loading-text">
            Identificando módulos e comparando com {templates.length} templates do catálogo...
          </p>
        </div>
      )}

      {/* ── REVIEW: Resultados do scan ── */}
      {step === 'review' && (
        <div className="wizard-body">
          <div className="wizard-summary">
            <div className="wizard-stat scan-ok">
              <span className="wizard-stat-value">{matched.length}</span>
              <span className="wizard-stat-label">Reconhecidos</span>
            </div>
            <div className="wizard-stat scan-warn">
              <span className="wizard-stat-value">{unmatched.length}</span>
              <span className="wizard-stat-label">Sem Match</span>
            </div>
            <div className="wizard-stat" style={{ color: 'var(--purple)' }}>
              <span className="wizard-stat-value">{totalShared}</span>
              <span className="wizard-stat-label">Shared Props</span>
            </div>
            <div className="wizard-stat" style={{ color: 'var(--brand)' }}>
              <span className="wizard-stat-value">{totalExclusive}</span>
              <span className="wizard-stat-label">Exclusivas</span>
            </div>
          </div>

          {/* Lista de módulos encontrados */}
          <div className="wizard-module-list">
            {scanReport.map((mod) => (
              <div
                key={mod.nodeId}
                className={`wizard-module-item ${
                  mod.matchType !== 'none' ? 'module-matched' : 'module-unmatched'
                }`}
              >
                <div className="wizard-module-icon">
                  {mod.matchType !== 'none' ? '✅' : '❓'}
                </div>
                <div className="wizard-module-info">
                  <span className="wizard-module-name">{mod.name}</span>
                  <span className="wizard-module-meta">
                    {mod.matchType !== 'none' ? (
                      <>
                        → <strong>{mod.templateName}</strong>
                        <span className={`match-badge match-${mod.matchType}`}>
                          {mod.matchType} ({Math.round(mod.matchScore * 100)}%)
                        </span>
                      </>
                    ) : (
                      'Sem template correspondente'
                    )}
                  </span>
                  {mod.propsAnalysis?.hasDesktopMobile && (
                    <span className="wizard-module-detail">
                      🖥️ {mod.propsAnalysis.deskOnlyCount} desk
                      {' · '}📱 {mod.propsAnalysis.mobileOnlyCount} mobile
                      {' · '}🔗 {mod.propsAnalysis.sharedCount} shared
                    </span>
                  )}
                </div>
                <span className="wizard-module-props">
                  {mod.foundProps}/{mod.expectedProps}
                </span>
              </div>
            ))}
          </div>

          {matched.length > 0 && (
            <button className="btn btn-primary btn-lg" onClick={executeLoad}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Carregar {totalShared + totalExclusive} Propriedades
            </button>
          )}

          <button
            className="btn btn-outline"
            style={{ marginTop: '8px' }}
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* ── LOADING ── */}
      {step === 'loading' && (
        <div className="wizard-body">
          <ProgressBar indeterminate label="Carregando propriedades no Figma..." variant="purple" />
          <p className="wizard-loading-text">
            Criando Component Properties e linkando nós Desktop ↔ Mobile...
          </p>
        </div>
      )}

      {/* ── DONE ── */}
      {step === 'done' && result && (
        <div className="wizard-body">
          <div className="wizard-done-icon">🎉</div>
          <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>
            Setup Concluído!
          </h3>
          <div className="wizard-summary">
            <div className="wizard-stat scan-ok">
              <span className="wizard-stat-value">{result.totalPropsCreated}</span>
              <span className="wizard-stat-label">Props Criadas</span>
            </div>
            <div className="wizard-stat" style={{ color: 'var(--purple)' }}>
              <span className="wizard-stat-value">{result.totalLinksCreated}</span>
              <span className="wizard-stat-label">Links Desk↔Mob</span>
            </div>
          </div>
          <p className="wizard-done-text">
            As propriedades foram carregadas no painel lateral do Figma.
            Alterar uma prop compartilhada atualiza automaticamente Desktop e Mobile.
          </p>
          <button className="btn btn-primary" onClick={onClose}>
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
