/**
 * @file input.jsx
 * shadcn/ui-style Input component (JS version).
 */
import React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'w-full py-2.5 px-3 bg-bg-secondary border border-border text-text-primary rounded-[var(--radius-sm)] font-sans text-xs outline-none transition-colors focus:border-brand placeholder:text-text-tertiary/50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
