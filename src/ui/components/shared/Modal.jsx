import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ show, onClose, title, description, children, wide }) {
  const overlayRef = useRef(null);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.target === overlayRef.current && onClose?.()}
        >
          <motion.div
            className={`relative bg-bg border border-border rounded-[var(--radius-lg)] shadow-glass flex flex-col overflow-hidden w-full ${wide ? 'max-w-[420px]' : 'max-w-[360px]'} max-h-[85vh]`}
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            {(title || description) && (
              <div className="px-5 pt-5 pb-4 border-b border-border shrink-0">
                {title && (
                  <h3 className="text-sm font-bold text-text-primary m-0 mb-1">{title}</h3>
                )}
                {description && (
                  <p className="text-[11px] text-text-secondary leading-relaxed m-0">{description}</p>
                )}
              </div>
            )}
            <div className="overflow-y-auto flex-1 p-5">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
