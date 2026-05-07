/**
 * @file skeleton.jsx
 * shadcn/ui-style Skeleton component (JS version).
 */
import React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-white/4 via-white/8 to-white/4 bg-[length:200%_100%] rounded animate-shimmer',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
