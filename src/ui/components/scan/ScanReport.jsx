/**
 * @file ScanReport.jsx
 * Tela de relatório do scan do Figma.
 * Lista módulos com status visual + preview JSON + confirmar deploy.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScan } from '../../hooks/useScan';
import { useFigmaMessages } from '../../hooks/useFigmaMessages';
import ModuleStatusItem from './ModuleStatusItem';
import JsonPreview from './JsonPreview';
import ProgressBar from '../shared/ProgressBar';
import useAppStore from '../../stores/appStore';

export default function ScanReport() {
  const {
    status,
    report,
    jsonPreview,
    progress,
    runScan,
    processModules,
    deployFullPage,
    reset,
    isDeploying,
  } = useScan();

  const figma = useFigmaMessages();
  const addToast = useAppStore((s) => s.addToast);
  const linkedNid = figma.linkedNid;

  // Listener para resultado do scan do sandbox
  useEffect(() => {
    function handleMessage(event) {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === 'page-modules' && status === 'scanning') {
        processModules(msg.modules || []);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [status, processModules]);

  const handleDeploy = () => {
    if (!linkedNid) {
      addToast({ type: 'error', message: 'Vincule um NID antes de fazer deploy.' });
      return;
    }
    deployFullPage();
  };

  return (
    <div className="scan-screen">
      {/* Botão de scan */}
      <div className="scan-actions-top">
        <button
          className="btn btn-primary btn-lg"
          onClick={runScan}
          disabled={status === 'scanning' || status === 'validating'}
        >
          {status === 'idle' || status === 'done' || status === 'error' ? (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M1 4V2.5A1.5 1.5 0 012.5 1H4M12 1h1.5A1.5 1.5 0 0115 2.5V4M15 12v1.5a1.5 1.5 0 01-1.5 1.5H12M4 15H2.5A1.5 1.5 0 011 13.5V12"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Escanear Página do Figma
            </>
          ) : (
            <>
              <span className="spinner" />
              Escaneando...
            </>
          )}
        </button>

        {status === 'done' && (
          <button className="btn btn-outline btn-sm" onClick={reset}>
            Limpar relatório
          </button>
        )}
      </div>

      {/* Progress */}
      {(status === 'scanning' || status === 'validating') && (
        <ProgressBar
          progress={progress}
          label={status === 'scanning' ? 'Lendo módulos do Figma...' : 'Validando nomenclatura...'}
          variant="brand"
        />
      )}

      {/* Relatório */}
      {report && (
        <motion.div
          className="scan-report glass-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Resumo */}
          <div className="scan-summary">
            <div className="scan-summary-item scan-ok">
              <span className="scan-summary-count">{report.recognized.length}</span>
              <span className="scan-summary-label">OK</span>
            </div>
            <div className="scan-summary-item scan-warn">
              <span className="scan-summary-count">{report.warnings.length}</span>
              <span className="scan-summary-label">Atenção</span>
            </div>
            <div className="scan-summary-item scan-fail">
              <span className="scan-summary-count">{report.unknown.length}</span>
              <span className="scan-summary-label">Desconhecido</span>
            </div>
          </div>

          {/* Lista de módulos */}
          <div className="scan-modules-list">
            {report.recognized.map((mod) => (
              <ModuleStatusItem key={mod.name} module={mod} />
            ))}
            {report.warnings.map((mod) => (
              <ModuleStatusItem key={mod.name} module={mod} />
            ))}
            {report.unknown.map((mod) => (
              <ModuleStatusItem key={mod.name} module={mod} />
            ))}
          </div>

          {/* Preview JSON */}
          {jsonPreview && (
            <JsonPreview data={jsonPreview} title="Payload de Deploy" />
          )}

          {/* Botão de deploy */}
          <div className="scan-deploy-area">
            <button
              className={`btn btn-deploy btn-lg ${isDeploying ? 'btn-loading' : ''}`}
              onClick={handleDeploy}
              disabled={!linkedNid || isDeploying}
            >
              {isDeploying ? (
                <>
                  <span className="spinner" />
                  Enviando...
                </>
              ) : (
                'Confirmar Deploy'
              )}
            </button>
            {!linkedNid && (
              <p className="scan-deploy-hint">Vincule um NID na Home para habilitar o deploy.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Estado vazio */}
      {status === 'idle' && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="8" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
              <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
            </svg>
          </div>
          <p>Clique em "Escanear" para analisar<br />os módulos da página atual do Figma.</p>
        </div>
      )}
    </div>
  );
}
