/**
 * @file progress.jsx
 * shadcn/ui-style Progress component (JS version).
 */
import React from 'react';
import { cn } from '@/lib/utils';

function Progress({ value = 0, max = 100, variant = 'brand', label, showPercentage, small, className, ...props }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const fillColors = {
    brand: 'bg-brand',
    success: 'bg-success',
    purple: 'bg-purple',
  };

  return (
    <div className={cn('mb-4', className)} {...props}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-[11px] font-semibold text-text-secondary mb-1.5">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={cn('bg-bg-secondary rounded-sm overflow-hidden relative', small ? 'h-1' : 'h-1.5')}>
        <div
          className={cn('h-full rounded-sm absolute left-0 top-0 transition-all', fillColors[variant] || 'bg-brand')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export { Progress };
