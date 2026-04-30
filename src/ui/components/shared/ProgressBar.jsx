/**
 * @file ProgressBar.jsx
 * Barra de progresso animada com modo determinado e indeterminado.
 */

import React from 'react';
import { motion } from 'framer-motion';

export default function ProgressBar({
  progress = 0,         // 0–100 (modo determinado)
  indeterminate = false, // Se true, anima infinitamente
  label = '',
  variant = 'brand',    // 'brand' | 'success' | 'purple'
  size = 'md',          // 'sm' | 'md'
}) {
  const barClass = `progress-bar progress-bar-${variant} progress-bar-${size}`;

  return (
    <div className="progress-wrapper">
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          {!indeterminate && <span className="progress-percent">{Math.round(progress)}%</span>}
        </div>
      )}
      <div className={barClass}>
        {indeterminate ? (
          <motion.div
            className="progress-fill"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ width: '40%' }}
          />
        ) : (
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}
      </div>
    </div>
  );
}
