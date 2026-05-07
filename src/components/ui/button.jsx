/**
 * @file button.jsx
 * shadcn/ui-style Button component (JS version).
 */
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none font-sans',
  {
    variants: {
      variant: {
        default: 'bg-brand text-white shadow-[0_4px_14px_rgba(13,153,255,0.3)] hover:bg-brand-hover hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(13,153,255,0.4)] active:translate-y-0',
        primary: 'bg-brand text-white shadow-[0_4px_14px_rgba(13,153,255,0.3)] hover:bg-brand-hover hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(13,153,255,0.4)] active:translate-y-0',
        deploy: 'bg-purple text-white shadow-[0_4px_14px_rgba(163,113,247,0.3)] hover:bg-purple-hover hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(163,113,247,0.4)] active:translate-y-0',
        success: 'bg-success text-white hover:bg-success/90',
        outline: 'bg-transparent border border-border text-text-secondary hover:border-text-secondary hover:text-text-primary hover:bg-bg-hover',
        danger: 'bg-transparent border border-danger text-danger hover:bg-danger-soft',
        ghost: 'bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary',
      },
      size: {
        default: 'w-full py-2.5 px-4 text-xs rounded-[var(--radius-sm)]',
        sm: 'w-auto py-1.5 px-3 text-[11px] rounded-[var(--radius-sm)]',
        lg: 'w-full py-3.5 px-4 text-[13px] rounded-[var(--radius-md)]',
        icon: 'w-8 h-8 p-0 rounded-[var(--radius-sm)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
