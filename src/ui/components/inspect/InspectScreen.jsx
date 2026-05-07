/**
 * @file InspectScreen.jsx
 * Tela de inspeção de módulos selecionados no Figma.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModuleDetail from './ModuleDetail';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useAppStore from '../../stores/appStore';
import { postToFigma } from '../../hooks/useFigmaMessages';
import { ScanSearch, Loader2, CheckCircle2, AlertTriangle, HelpCircle, ChevronDown } from 'lucide-react';

export default function InspectScreen({ templates }) {
  const [scanReport, setScanReport] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);
  const navigate = useAppStore((s) => s.navigate);

  useEffect(() => {
    function handleMessage(event) {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === 'scan-report-result') {
        setScanReport(msg.report || []);
        setIsScanning(false);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleScan = () => {
    setIsScanning(true);
    const templateList = (templates || []).flatMap((mod) =>
      (mod.variations || []).map((v) => ({
        componentName: v.name,
        module_name: mod.module,
        properties: v.fields || [],
      }))
    );
    postToFigma({ type: 'full-page-scan-report', templates: templateList });
  };

  const matched = scanReport.filter((r) => r.matchType !== 'none');
  const unmatched = scanReport.filter((r) => r.matchType === 'none');

  return (
    <div className="flex flex-col p-5 h-full">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-text-primary m-0 mb-1">Inspeção de Módulos</h3>
        <p className="text-[11px] text-text-secondary leading-relaxed m-0">
          Analise os módulos da página e verifique a correspondência com os templates.
        </p>
      </div>

      {scanReport.length === 0 && !isScanning && (
        <div className="flex flex-col items-center justify-center p-10 mt-5 border border-dashed border-border rounded-[var(--radius-md)] bg-bg-secondary text-center">
          <ScanSearch className="w-10 h-10 text-text-tertiary mb-3 opacity-50" />
          <p className="text-xs font-medium text-text-secondary mb-5">Escaneie a página para detectar módulos</p>
          <Button variant="primary" size="lg" onClick={handleScan}>
            Escanear Página
          </Button>
        </div>
      )}

      {isScanning && (
        <div className="flex flex-col items-center justify-center p-10 mt-5 text-brand">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-[11px] font-bold uppercase tracking-[1px]">Escaneando módulos...</span>
        </div>
      )}

      {scanReport.length > 0 && (
        <div className="flex flex-col gap-4">
          {/* Stats */}
          <div className="flex items-center gap-2 p-1.5 bg-bg-secondary border border-border rounded-[var(--radius-md)] overflow-hidden">
            <div className="flex flex-col items-center flex-1 py-1">
              <span className="text-sm font-bold text-text-primary">{scanReport.length}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.5px] text-text-tertiary">Total</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex flex-col items-center flex-1 py-1 text-success">
              <span className="text-sm font-bold">{matched.length}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.5px]">Reconhecidos</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex flex-col items-center flex-1 py-1 text-warning">
              <span className="text-sm font-bold">{unmatched.length}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.5px]">Sem Match</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="pr-1">
              <Button variant="outline" size="sm" onClick={handleScan}>Re-scan</Button>
            </div>
          </div>

          {/* Lista de módulos */}
          <div className="flex flex-col gap-2">
            {scanReport.map((mod) => {
              const isExpanded = expandedModule === mod.nodeId;
              
              let Icon = HelpCircle;
              let iconColor = 'text-text-tertiary';
              
              if (mod.matchType === 'exact') {
                Icon = CheckCircle2;
                iconColor = 'text-success';
              } else if (mod.matchType === 'contains' || mod.matchType === 'fuzzy') {
                Icon = AlertTriangle;
                iconColor = 'text-warning';
              }

              return (
                <div key={mod.nodeId} className="flex flex-col border border-border rounded-[var(--radius-sm)] bg-bg overflow-hidden shadow-[var(--shadow-sm)]">
                  <button
                    className={`flex items-center p-3 gap-3 w-full bg-transparent border-none text-left cursor-pointer transition-colors outline-none ${isExpanded ? 'bg-bg-secondary border-b border-border' : 'hover:bg-bg-hover'}`}
                    onClick={() => setExpandedModule(isExpanded ? null : mod.nodeId)}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[12px] font-bold text-text-primary truncate mb-0.5">{mod.name}</span>
                      <span className="text-[10px] text-text-secondary truncate font-mono">
                        {mod.templateName
                          ? `→ ${mod.templateName} (${Math.round(mod.matchScore * 100)}%)`
                          : 'Sem template'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-text-tertiary bg-black/20 px-1.5 py-0.5 rounded shrink-0">
                      {mod.foundProps} props
                    </span>
                    <ChevronDown className={`w-4 h-4 text-text-tertiary shrink-0 transition-transform ${isExpanded ? 'rotate-180 text-brand' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                        className="bg-bg-secondary p-3"
                      >
                        <ModuleDetail
                          module={mod}
                          onNavigateDeploy={() => navigate('deploy')}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
