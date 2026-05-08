/**
 * @file DeployReviewScreen.jsx
 * Modal de revisão de deploy: diff visual, full-page JSON, overrides de campos não-Figma.
 *
 * CRITICAL RULE: ALL modules (Figma + Drupal-preserved) are shown and deployed.
 * Drupal-only modules are included with their existing data to prevent canvas wipe.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useDeployStore from '../../stores/deployStore';
import useTemplateStore from '../../stores/templateStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  X, Trash2, PlusCircle, CheckCircle, AlertCircle, Package,
  Send, ChevronDown, Code2, Eye, EyeOff,
} from 'lucide-react';

// ── Clipboard helper (works inside Figma iframe) ──────────
function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => copyFallback(text));
  } else {
    copyFallback(text);
  }
}
function copyFallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
}

// ── Editable field renderer ────────────────────────────────
function OverrideField({ name, type, currentValue, onChange }) {
  const val = currentValue ?? '';

  if (type === 'BOOLEAN') {
    return (
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <button
          type="button"
          onClick={() => onChange(name, !val)}
          className={`relative w-8 h-4 rounded-full border-none outline-none transition-colors ${val ? 'bg-brand' : 'bg-text-tertiary/40'}`}
        >
          <span
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${val ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </button>
        <span className="text-[10px] font-mono text-text-secondary">{name}</span>
        <Badge variant={val ? 'success' : 'muted'} size="xs">{String(val)}</Badge>
      </label>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-text-secondary shrink-0 w-[120px] truncate" title={name}>{name}</span>
      <input
        type="text"
        value={val}
        onChange={(e) => onChange(name, e.target.value)}
        className="flex-1 bg-bg border border-border rounded-sm px-2 py-1 text-[10px] font-mono text-text-primary outline-none focus:border-brand transition-colors"
        placeholder="Valor…"
      />
    </div>
  );
}

export default function DeployReviewScreen({ onConfirm, onClose }) {
  const {
    pageModules,
    deletedModules,
    toggleModuleDelete,
    isDeploying,
    deployProgress,
    moduleOverrides,
    setModuleOverride,
  } = useDeployStore();

  const templates = useTemplateStore((s) => s.templates);

  const [expandedDiffs, setExpandedDiffs] = useState(new Set());
  const [showJson, setShowJson] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  const toggleDiff = (id) =>
    setExpandedDiffs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Derived data ──────────────────────────────────────────
  const activeModules = pageModules.filter((m) => !deletedModules.has(m.id));
  const removedCount  = deletedModules.size;

  // Full merged page JSON for preview (applies overrides)
  const fullPageJson = useMemo(
    () =>
      activeModules
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((m) => ({
          module_name: m.name,
          order: m.order,
          data: { ...m.data, ...(moduleOverrides[m.id] || {}) },
        })),
    [activeModules, moduleOverrides],
  );

  // Template lookup map: module_name → fields[]
  const templateFieldMap = useMemo(() => {
    const map = new Map();
    (templates || []).forEach((t) =>
      (t.variations || []).forEach((v) => {
        if (!map.has(v.name)) map.set(v.name, v.fields || []);
      }),
    );
    return map;
  }, [templates]);

  // For a given module, find fields NOT present in mod.data (candidates for override)
  function getMissingFields(mod) {
    const fields = templateFieldMap.get(mod.name) || [];
    const overrideKeys = Object.keys(moduleOverrides[mod.id] || {});
    return fields.filter(
      (f) =>
        f.type !== 'SLOT' &&
        f.type !== 'TEXT' &&   // TEXT comes from Figma; BOOLEAN/VARIANT may not
        !(f.name in (mod.data || {})) ||
        overrideKeys.includes(f.name), // always show if user already set an override
    );
  }

  const handleCopyJson = () => {
    copyToClipboard(JSON.stringify(fullPageJson, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary" style={{ maxHeight: '90vh' }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-bg border-b border-border shrink-0">
        <div className="flex flex-col flex-1">
          <h2 className="text-[14px] font-bold text-text-primary m-0">Revisar Deploy</h2>
          <span className="text-[10px] text-text-tertiary">
            {activeModules.length} módulo{activeModules.length !== 1 ? 's' : ''} · Confirme antes de publicar
          </span>
        </div>
        <div className="flex items-center gap-2">
          {removedCount > 0 && (
            <Badge variant="danger" size="xs">-{removedCount}</Badge>
          )}
          <button
            onClick={() => setShowJson((v) => !v)}
            className="p-1.5 rounded border border-border bg-transparent text-text-tertiary hover:text-brand hover:border-brand transition-colors outline-none"
            title={showJson ? 'Ocultar JSON' : 'Ver JSON completo'}
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded border-none bg-transparent text-text-tertiary hover:text-danger hover:bg-danger-soft transition-colors outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── JSON Preview Toggle ─────────────────────────────── */}
      <AnimatePresence>
        {showJson && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
            className="shrink-0"
          >
            <div className="border-b border-border bg-bg-secondary">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  JSON Completo da Página ({activeModules.length} módulos)
                </span>
                <button
                  onClick={handleCopyJson}
                  className="text-[10px] font-semibold text-brand hover:text-brand-hover border-none bg-transparent outline-none cursor-pointer"
                >
                  {jsonCopied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
              <pre className="json-preview-code px-4 pb-3 max-h-[180px] overflow-y-auto text-[9px] leading-relaxed">
                {JSON.stringify(fullPageJson, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Module List ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {pageModules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
            <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs">Nenhum módulo detectado na página.</p>
          </div>
        )}

        {pageModules.map((mod, index) => {
          const isDeleted   = deletedModules.has(mod.id);
          const isFromDrupal = mod.source === 'drupal';
          const hasDiff     = mod.isModified && mod.diff;
          const diffExpanded = expandedDiffs.has(mod.id);
          const changedCount = mod.diff?.changed?.length || 0;
          const removedFieldCount = mod.diff?.removed?.length || 0;
          const missingFields = getMissingFields(mod);
          const overrides = moduleOverrides[mod.id] || {};

          const borderColor = isDeleted
            ? 'border-l-danger'
            : isFromDrupal
            ? 'border-l-text-tertiary'
            : mod.isNew
            ? 'border-l-success'
            : mod.isModified
            ? 'border-l-warning'
            : 'border-l-border';

          return (
            <Card
              key={mod.id}
              className={`relative overflow-visible border-l-4 p-0 mb-0 transition-opacity ${borderColor} ${isDeleted ? 'opacity-50' : ''}`}
            >
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5 ${isDeleted ? 'bg-danger/20 text-danger' : 'bg-brand-soft text-brand'}`}>
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-text-primary truncate font-mono max-w-[200px]" title={mod.name}>
                        {mod.name}
                      </span>
                      {!isDeleted && (
                        isFromDrupal ? (
                          <Badge variant="muted" size="xs">Drupal</Badge>
                        ) : mod.isNew ? (
                          <Badge variant="success" size="xs">Novo</Badge>
                        ) : mod.isModified ? (
                          <Badge variant="warning" size="xs">Editado</Badge>
                        ) : (
                          <Badge variant="muted" size="xs">Igual</Badge>
                        )
                      )}
                      {Object.keys(overrides).length > 0 && !isDeleted && (
                        <Badge variant="purple" size="xs">{Object.keys(overrides).length} override{Object.keys(overrides).length !== 1 ? 's' : ''}</Badge>
                      )}
                    </div>

                    <span className="text-[9px] text-text-tertiary">
                      {isFromDrupal
                        ? 'Preservado do Drupal'
                        : `Posição ${index + 1}${mod.pageName ? ` · ${mod.pageName}` : ''}`}
                    </span>

                    {/* Diff pill button */}
                    {!isDeleted && (hasDiff || missingFields.length > 0) && (
                      <button
                        onClick={() => toggleDiff(mod.id)}
                        className="flex items-center gap-1 mt-0.5 text-[10px] text-warning hover:text-warning/80 transition-colors border-none bg-transparent p-0 cursor-pointer outline-none w-fit"
                      >
                        {changedCount > 0 && (
                          <span className="bg-warning/20 px-1.5 py-0.5 rounded font-semibold">
                            {changedCount} alterado{changedCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {removedFieldCount > 0 && (
                          <span className="bg-danger/20 text-danger px-1.5 py-0.5 rounded font-semibold">
                            {removedFieldCount} removido{removedFieldCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {missingFields.length > 0 && (
                          <span className="bg-purple-soft text-purple px-1.5 py-0.5 rounded font-semibold">
                            {missingFields.length} extra
                          </span>
                        )}
                        <ChevronDown className={`w-3 h-3 transition-transform ${diffExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {!isDeploying && (
                  <button
                    onClick={() => toggleModuleDelete(mod.id)}
                    className={`p-1.5 rounded transition-colors border-none bg-transparent shrink-0 ${isDeleted ? 'text-success hover:bg-success/10' : 'text-text-tertiary hover:text-danger hover:bg-danger/10'}`}
                    title={isDeleted ? 'Restaurar módulo' : 'Remover do deploy'}
                  >
                    {isDeleted ? <PlusCircle className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* ── Expanded diff + overrides ─────────────────── */}
              <AnimatePresence>
                {diffExpanded && !isDeleted && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: 'hidden' }}
                    className="border-t border-border/40"
                  >
                    <div className="px-3 py-2.5 bg-bg-secondary flex flex-col gap-2">
                      {/* Field diffs */}
                      {hasDiff && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider mb-0.5">Alterações Figma vs Drupal</span>
                          {mod.diff.changed.map((c) => (
                            <div key={c.field} className="flex flex-col gap-0.5 py-1 border-b border-border/30 last:border-b-0">
                              <span className="text-[10px] font-mono font-bold text-text-secondary">{c.field}</span>
                              <div className="flex gap-2 text-[9px] font-mono">
                                <span className="text-danger/80 line-through truncate flex-1" title={String(c.drupalValue ?? '')}>{String(c.drupalValue ?? '')}</span>
                                <span className="text-success truncate flex-1" title={String(c.figmaValue ?? '')}>{String(c.figmaValue ?? '')}</span>
                              </div>
                            </div>
                          ))}
                          {mod.diff.removed.map((r) => (
                            <div key={r.field} className="flex flex-col gap-0.5 py-1 border-b border-border/30 last:border-b-0">
                              <span className="text-[10px] font-mono font-bold text-danger/80">{r.field}</span>
                              <span className="text-[9px] font-mono text-danger/60 line-through truncate">{String(r.drupalValue ?? '')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Non-Figma editable fields (BOOLEAN, VARIANT not extracted from Figma) */}
                      {missingFields.length > 0 && (
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-border/30">
                          <span className="text-[9px] font-bold text-purple uppercase tracking-wider">
                            Propriedades não-Figma (editáveis)
                          </span>
                          {missingFields.map((f) => (
                            <OverrideField
                              key={f.name}
                              name={f.name}
                              type={f.type}
                              currentValue={overrides[f.name] ?? mod.data?.[f.name]}
                              onChange={(name, value) => setModuleOverride(mod.id, name, value)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-bg border-t border-border flex flex-col gap-2 shrink-0">
        {isDeploying && deployProgress && (
          <div className="flex flex-col gap-1.5 p-2.5 bg-brand-soft border border-brand/20 rounded-sm">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-brand">
                {deployProgress.current}/{deployProgress.total} módulos…
              </span>
              <span className="font-mono text-text-tertiary truncate max-w-[160px] text-[10px]">{deployProgress.name}</span>
            </div>
            <Progress value={(deployProgress.current / deployProgress.total) * 100} variant="brand" className="mb-0" />
          </div>
        )}

        {!isDeploying && (
          <div className="flex items-start gap-2 text-[10px] p-2 bg-brand-soft/10 border border-brand/10 rounded-sm">
            <CheckCircle className="w-3 h-3 text-brand shrink-0 mt-0.5" />
            <span className="text-text-secondary">
              {activeModules.length} módulo{activeModules.length !== 1 ? 's' : ''} serão publicados
              {removedCount > 0 ? `, ${removedCount} excluído${removedCount !== 1 ? 's' : ''}` : ''}.
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeploying} className="flex-1 w-auto">
            Cancelar
          </Button>
          <Button
            variant="deploy"
            size="lg"
            onClick={onConfirm}
            disabled={isDeploying || activeModules.length === 0}
            className="flex-[2]"
          >
            {isDeploying ? (
              'Publicando…'
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Publicar ({activeModules.length})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
