/**
 * @file BoundState.jsx
 * Estado "vinculado" da tela Home — quando o NID está definido.
 *
 * Mostra: badge NID, banner de sync status, módulo selecionado,
 * preview de dados, botões de Deploy, Sync, Templates, Download.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NidBadge from '../shared/NidBadge';
import PropertyList from '../shared/PropertyList';
import useAppStore from '../../stores/appStore';
import useAuthStore from '../../stores/authStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Send, RefreshCw, ScanLine, Layers, Download, Info } from 'lucide-react';

export default function BoundState({
  linkedNid,
  currentModuleName,
  extractedData,
  currentMeta,
  onDeploy,
  onSync,
  onDownload,
  syncStatus = 'idle',
  syncDiff = null,
  onApplySync,
}) {
  const navigate = useAppStore((s) => s.navigate);
  const isDevRole = useAuthStore((s) => s.user?.role === 'dev');
  const hasModule = !!currentModuleName;

  return (
    <motion.div
      className="glass-panel p-4 mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Header com NID */}
      <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-border">
        <div className="text-[11px] font-semibold text-text-tertiary uppercase">Arquivo vinculado a</div>
        <NidBadge nid={linkedNid} />
      </div>

      {/* ★ Sync Status Banner */}
      <AnimatePresence>
        {syncStatus === 'checking' && (
          <motion.div
            className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-sm)] mb-3.5 text-[11px] font-medium bg-brand-soft border border-brand/20 text-brand"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>Verificando sincronização com o Drupal...</span>
          </motion.div>
        )}

        {syncStatus === 'synced' && (
          <motion.div
            className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-sm)] mb-3.5 text-[11px] font-medium bg-success-soft border border-success/20 text-success"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Tudo sincronizado com o Drupal</span>
          </motion.div>
        )}

        {syncStatus === 'outdated' && syncDiff && (
          <motion.div
            className="flex items-start gap-2.5 p-2.5 rounded-[var(--radius-sm)] mb-3.5 text-[11px] font-medium bg-warning-soft border border-warning/20 text-warning"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex flex-col gap-2.5 w-full">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>{syncDiff.totalChanges}</strong>
                  {syncDiff.totalChanges === 1 ? ' campo desatualizado' : ' campos desatualizados'}
                </span>
              </div>
              {syncDiff.changed.length > 0 && (
                <div className="flex flex-col gap-1 p-2 bg-black/15 rounded-[var(--radius-sm)]">
                  {syncDiff.changed.slice(0, 5).map((c) => (
                    <div key={c.field} className="flex items-center gap-1.5 text-[10px]">
                      <span className="font-mono font-semibold text-text-primary">{c.field}</span>
                      <span className="text-text-tertiary">→</span>
                      <span className="text-success truncate">{String(c.drupalValue).substring(0, 30)}</span>
                    </div>
                  ))}
                  {syncDiff.changed.length > 5 && (
                    <span className="text-[9px] text-text-tertiary italic mt-1">
                      +{syncDiff.changed.length - 5} mais
                    </span>
                  )}
                </div>
              )}
              <Button size="sm" variant="default" onClick={onApplySync} className="w-auto">
                Aplicar Atualizações do Drupal
              </Button>
            </div>
          </motion.div>
        )}

        {syncStatus === 'error' && (
          <motion.div
            className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-sm)] mb-3.5 text-[11px] font-medium bg-danger-soft border border-danger/20 text-danger"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Não foi possível verificar sync</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Módulo selecionado */}
      {hasModule && (
        <div className="flex items-center gap-2 bg-bg border border-border rounded-[var(--radius-sm)] py-2 px-3 mb-3.5">
          <span className="text-[10px] font-semibold text-text-tertiary tracking-[0.5px]">MÓDULO</span>
          <input 
            type="text" 
            value={currentModuleName} 
            readOnly 
            className="flex-1 bg-transparent border-none text-text-primary text-xs font-semibold outline-none"
          />
        </div>
      )}

      {/* Preview de dados extraídos */}
      {hasModule && (
        <PropertyList data={extractedData} meta={currentMeta} />
      )}

      {!hasModule && (
        <div className="flex flex-col items-center text-center py-10 px-5 text-text-tertiary gap-3">
          <Info className="w-6 h-6" />
          <p className="text-xs">Selecione um módulo no Figma para ver os dados extraídos.</p>
        </div>
      )}

      {/* Ações principais */}
      <div className="flex flex-col gap-3 mt-5 sm:grid sm:grid-cols-2">
        <Button variant="deploy" size="lg" onClick={onDeploy} disabled={!hasModule} className="sm:col-span-2">
          <Send className="w-3.5 h-3.5" />
          Deploy para o Drupal
        </Button>

        <div className="flex gap-2">
          <Button variant="default" onClick={onSync} className="flex-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </Button>
          <Button variant="outline" onClick={() => navigate('scan')} className="flex-1">
            <ScanLine className="w-3.5 h-3.5" />
            Scan
          </Button>
        </div>

        {isDevRole && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('templates')} className="flex-1">
              <Layers className="w-3.5 h-3.5 mr-1" />
              Templates
            </Button>
            <Button variant="outline" onClick={onDownload} className="flex-1">
              <Download className="w-3.5 h-3.5 mr-1" />
              JSON
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
