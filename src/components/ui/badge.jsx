/**
 * @file badge.jsx
 * shadcn/ui-style Badge component (JS version).
 */
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-bold uppercase whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-brand-soft text-brand',
        info:    'bg-brand-soft text-brand',
        success: 'bg-success-soft text-success',
        danger:  'bg-danger-soft text-danger',
        warning: 'bg-warning-soft text-warning',
        purple:  'bg-purple-soft text-purple',
        muted:   'bg-white/[0.06] text-text-tertiary',
      },
      size: {
        default: 'text-[9px] px-1.5 py-0.5 rounded',
        xs:      'text-[8px] px-1 py-px rounded',
        sm:      'text-[8px] px-1 py-px rounded',
        lg:      'text-[10px] px-2.5 py-1 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Badge({ className, variant, size, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
