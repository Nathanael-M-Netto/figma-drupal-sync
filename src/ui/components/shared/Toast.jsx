/**
 * @file Toast.jsx
 * Sistema de notificações animadas (toast).
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../../stores/appStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 shrink-0" />,
  info: <Info className="w-4 h-4 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
};

const STYLES = {
  success: 'bg-success-soft border-success/20 text-success shadow-[0_4px_12px_rgba(46,160,67,0.15)]',
  error: 'bg-danger-soft border-danger/20 text-danger shadow-[0_4px_12px_rgba(248,81,73,0.15)]',
  info: 'bg-brand-soft border-brand/20 text-brand shadow-[0_4px_12px_rgba(13,153,255,0.15)]',
  warning: 'bg-warning-soft border-warning/20 text-warning shadow-[0_4px_12px_rgba(255,165,0,0.15)]',
};

function ToastItem({ toast }) {
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <motion.div
      className={`flex items-start gap-2.5 p-3.5 mb-2.5 rounded-[var(--radius-md)] border text-sm font-medium backdrop-blur-md pointer-events-auto w-full ${STYLES[toast.type]}`}
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      layout
    >
      <div className="mt-0.5">{ICONS[toast.type]}</div>
      <span className="flex-1 leading-relaxed text-text-primary text-[13px]">{toast.message}</span>
      <button
        className="bg-transparent border-none text-current opacity-70 hover:opacity-100 cursor-pointer p-0 shrink-0 ml-1 mt-0.5 transition-opacity"
        onClick={() => removeToast(toast.id)}
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);

  return (
    <div className="fixed top-[calc(var(--spacing-nav)+15px)] right-4 z-[9999] w-[300px] max-w-[calc(100vw-32px)] flex flex-col pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
