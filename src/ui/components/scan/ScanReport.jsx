/**
 * @file ScanReport.jsx
 * Tela de relatório do scan do Figma.
 * Lista módulos com status visual + preview JSON + confirmar deploy.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScan } from '../../hooks/useScan';
import { useFigmaMessages } from '../../hooks/useFigmaMessages';
import { useAuth } from '../../hooks/useAuth';
import ModuleStatusItem from './ModuleStatusItem';
import JsonPreview from './JsonPreview';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useAppStore from '../../stores/appStore';
import { Loader2, ScanSearch, Trash2, Send } from 'lucide-react';

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
  const { isDevRole } = useAuth();
  const addToast = useAppStore((s) => s.addToast);
  const linkedNid = figma.linkedNid;

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
    <div className="flex flex-col gap-4 p-5 h-full">
      {/* Botão de scan */}
      <div className="flex items-center gap-3">
        <Button
          size="lg"
          variant="primary"
          className="flex-1 bg-brand text-white shadow-[0_4px_14px_rgba(13,153,255,0.3)] hover:bg-brand-hover"
          onClick={runScan}
          disabled={status === 'scanning' || status === 'validating'}
        >
          {status === 'idle' || status === 'done' || status === 'error' ? (
            <>
              <ScanSearch className="w-4 h-4 mr-2" />
              Escanear Página do Figma
            </>
          ) : (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Escaneando...
            </>
          )}
        </Button>

        {status === 'done' && (
          <Button variant="outline" size="icon" onClick={reset} title="Limpar relatório">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Progress */}
      {(status === 'scanning' || status === 'validating') && (
        <Card className="p-4 m-0 bg-bg-secondary border-none">
          <Progress
            value={progress}
            label={status === 'scanning' ? 'Lendo módulos do Figma...' : 'Validando nomenclatura...'}
            variant="brand"
            showPercentage
          />
        </Card>
      )}

      {/* Relatório */}
      {report && (
        <motion.div
          className="glass-panel p-4 flex flex-col gap-4 mb-4"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Resumo */}
          <div className="flex bg-bg-secondary border border-border rounded-[var(--radius-sm)] p-1">
            <div className="flex-1 flex flex-col items-center justify-center p-2 text-success">
              <span className="text-sm font-bold">{report.recognized.length}</span>
              <span className="text-[9px] uppercase font-bold tracking-[0.5px]">OK</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-2 text-warning border-l border-border">
              <span className="text-sm font-bold">{report.warnings.length}</span>
              <span className="text-[9px] uppercase font-bold tracking-[0.5px]">Atenção</span>
            </div>
          </div>

          {/* Lista de módulos */}
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {report.recognized.map((mod) => (
              <ModuleStatusItem key={mod.name} module={mod} />
            ))}
            {report.warnings.map((mod) => (
              <ModuleStatusItem key={mod.name} module={mod} />
            ))}
          </div>

          {/* Preview JSON (apenas DEV) */}
          {jsonPreview && isDevRole && (
            <JsonPreview data={jsonPreview} title="Payload de Deploy" />
          )}

          {/* Botão de deploy */}
          <div className="pt-3 border-t border-border/50">
            <Button
              variant="deploy"
              size="lg"
              onClick={handleDeploy}
              disabled={!linkedNid || isDeploying}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Confirmar Deploy
                </>
              )}
            </Button>
            {!linkedNid && (
              <p className="text-[11px] text-warning text-center mt-2.5">Vincule um NID na Home para habilitar o deploy.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Estado vazio */}
      {status === 'idle' && (
        <div className="flex flex-col items-center justify-center p-10 text-center border border-dashed border-border rounded-[var(--radius-md)] bg-bg-secondary text-text-tertiary mt-8">
          <ScanSearch className="w-10 h-10 mb-4 opacity-50" />
          <p className="text-xs font-medium leading-relaxed">Clique em "Escanear" para analisar<br />os módulos da página atual do Figma.</p>
        </div>
      )}
    </div>
  );
}
