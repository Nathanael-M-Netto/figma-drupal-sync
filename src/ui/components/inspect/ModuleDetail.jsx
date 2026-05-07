/**
 * @file ModuleDetail.jsx
 * Detalhe expandido de um módulo detectado pelo scanner.
 */

import React from 'react';
import { Type, ToggleLeft, Palette, Link as LinkIcon, Monitor, Smartphone, Link2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TYPE_ICONS = {
  TEXT: <Type className="w-3.5 h-3.5 text-success" />,
  BOOLEAN: <ToggleLeft className="w-3.5 h-3.5 text-info" />,
  VARIANT: <Palette className="w-3.5 h-3.5 text-purple" />,
  URL: <LinkIcon className="w-3.5 h-3.5 text-warning" />,
};

export default function ModuleDetail({ module, onNavigateDeploy }) {
  const { propsAnalysis } = module;
  if (!propsAnalysis) return null;

  const hasDesktopMobile = propsAnalysis.hasDesktopMobile;

  return (
    <div className="flex flex-col gap-4">
      {hasDesktopMobile && (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="purple" className="flex items-center gap-1 px-2 py-1">
            <Monitor className="w-3.5 h-3.5" /> Desktop ({propsAnalysis.deskOnlyCount})
          </Badge>
          <Badge variant="warning" className="flex items-center gap-1 px-2 py-1">
            <Smartphone className="w-3.5 h-3.5" /> Mobile ({propsAnalysis.mobileOnlyCount})
          </Badge>
          <Badge variant="info" className="flex items-center gap-1 px-2 py-1">
            <Link2 className="w-3.5 h-3.5" /> Shared ({propsAnalysis.sharedCount})
          </Badge>
        </div>
      )}

      {propsAnalysis.sharedNames?.length > 0 && (
        <div className="flex flex-col">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[1px] mb-2 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> Shared (Desk ↔ Mob)
          </div>
          <div className="flex flex-col gap-1">
            {propsAnalysis.sharedNames.map((name) => (
              <div key={name} className="flex items-center gap-2 p-1.5 rounded-[var(--radius-sm)] bg-info/10 border border-info/20 text-[11px] font-mono">
                {TYPE_ICONS.TEXT}
                <span className="flex-1 text-text-primary truncate">{name}</span>
                <span className="text-[9px] bg-info/20 text-info px-1.5 py-0.5 rounded font-bold uppercase tracking-[0.5px]">shared</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {propsAnalysis.deskOnlyNames?.length > 0 && (
        <div className="flex flex-col">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[1px] mb-2 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5" /> Desktop Only
          </div>
          <div className="flex flex-col gap-1">
            {propsAnalysis.deskOnlyNames.map((name) => (
              <div key={name} className="flex items-center gap-2 p-1.5 rounded-[var(--radius-sm)] bg-purple/10 border border-purple/20 text-[11px] font-mono">
                {TYPE_ICONS.TEXT}
                <span className="flex-1 text-text-primary truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {propsAnalysis.mobileOnlyNames?.length > 0 && (
        <div className="flex flex-col">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[1px] mb-2 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Mobile Only
          </div>
          <div className="flex flex-col gap-1">
            {propsAnalysis.mobileOnlyNames.map((name) => (
              <div key={name} className="flex items-center gap-2 p-1.5 rounded-[var(--radius-sm)] bg-warning/10 border border-warning/20 text-[11px] font-mono">
                {TYPE_ICONS.TEXT}
                <span className="flex-1 text-text-primary truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 p-3 bg-black/20 rounded-[var(--radius-sm)]">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-text-secondary font-semibold w-[60px]">Match:</span>
          <Badge 
            variant={module.matchType === 'exact' ? 'success' : module.matchType === 'none' ? 'danger' : 'warning'} 
            size="sm"
          >
            {module.matchType} ({Math.round((module.matchScore || 0) * 100)}%)
          </Badge>
        </div>
        {module.templateName && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-text-secondary font-semibold w-[60px]">Template:</span>
            <span className="text-text-primary font-mono truncate">{module.templateName}</span>
          </div>
        )}
      </div>

      <Button variant="primary" size="sm" onClick={onNavigateDeploy} className="w-full mt-2">
        <Send className="w-3.5 h-3.5 mr-1.5" />
        Deploy este módulo
      </Button>
    </div>
  );
}
