/**
 * @file NidBadge.jsx
 * Badge visual com o NID vinculado e dot animado de status.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export default function NidBadge({ nid, small = false }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 bg-brand-soft text-brand font-semibold rounded-[var(--radius-sm)] border border-brand/20 shadow-[0_2px_8px_rgba(13,153,255,0.15)]",
      small ? "text-[11px] py-1 px-3" : "text-sm py-1.5 px-4"
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-dot" />
      <span>{nid ? `NID ${nid}` : 'Nenhum'}</span>
    </span>
  );
}
