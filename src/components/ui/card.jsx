/**
 * @file card.jsx
 * shadcn/ui-style Card component (JS version).
 */
import React from 'react';
import { cn } from '@/lib/utils';

function Card({ className, ...props }) {
  return (
    <div
      className={cn('border border-border rounded-[var(--radius-md)] p-5 mb-3.5', className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1.5 pb-3', className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-sm font-bold', className)} {...props} />;
}

function CardDescription({ className, ...props }) {
  return <p className={cn('text-[11px] text-text-secondary', className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn('', className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return <div className={cn('flex gap-2 pt-4', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
