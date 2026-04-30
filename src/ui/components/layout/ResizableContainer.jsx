/**
 * @file ResizableContainer.jsx
 * Container que gerencia o redimensionamento do plugin Figma.
 *
 * Envia mensagem RESIZE ao sandbox quando a tela muda,
 * para que o Figma atualize o tamanho da janela do plugin.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore, { SCREEN_SIZES } from '../../stores/appStore';
import { postToFigma } from '../../hooks/useFigmaMessages';

/**
 * Envia comando de resize para o sandbox do Figma.
 */
function requestResize(width, height) {
  try {
    postToFigma({ type: 'resize-ui', width, height });
  } catch {
    // Ignora se não estiver no contexto do Figma
  }
}

export default function ResizableContainer({ children }) {
  const currentScreen = useAppStore((s) => s.currentScreen);
  const previousScreen = useAppStore((s) => s.previousScreen);
  const containerRef = useRef(null);

  const [isResizing, setIsResizing] = useState(false);

  // Escuta os eventos de mouse para redimensionamento manual
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      // O cursor dentro do iframe reflete a largura/altura desejada
      const w = Math.max(360, e.clientX);
      const h = Math.max(500, e.clientY);
      requestResize(w, h);
    };

    const handleMouseUp = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Determina a direção da animação
  const screenOrder = ['login', 'home', 'templates', 'scan', 'settings'];
  const currentIdx = screenOrder.indexOf(currentScreen);
  const prevIdx = screenOrder.indexOf(previousScreen);
  const direction = currentIdx >= prevIdx ? 1 : -1;

  return (
    <div className="resizable-container" ref={containerRef}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentScreen}
          className="screen-wrapper"
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Handle de redimensionamento manual */}
      <div 
        className="resize-handle"
        onMouseDown={() => setIsResizing(true)}
      />
    </div>
  );
}
