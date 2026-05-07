/**
 * @file dialog.jsx
 * shadcn/ui-style Dialog/Modal component (JS version).
 */
import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return <>{children}</>;
}

function DialogOverlay({ className, onClick, ...props }) {
  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-5',
        className
      )}
      onClick={onClick}
      {...props}
    />
  );
}

function DialogContent({ className, open, onClose, children, ...props }) {
  const overlayRef = useRef(null);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  return (
    <DialogOverlay ref={overlayRef} onClick={handleOverlayClick}>
      <div
        className={cn(
          'bg-bg border border-border rounded-[var(--radius-lg)] p-6 w-full max-h-[90vh] overflow-y-auto shadow-md',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </DialogOverlay>
  );
}

function DialogHeader({ className, ...props }) {
  return <div className={cn('mb-4', className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
  return <h3 className={cn('text-sm font-bold mb-1.5', className)} {...props} />;
}

function DialogDescription({ className, ...props }) {
  return <p className={cn('text-[11px] text-text-secondary leading-relaxed', className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
  return <div className={cn('flex gap-2 mt-4', className)} {...props} />;
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
