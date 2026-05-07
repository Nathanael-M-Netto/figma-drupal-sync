/**
 * @file GlassSurface.jsx
 * Componente base do Design System Liquid Glass.
 *
 * Usa SVG inline com feDisplacementMap para criar efeito de
 * distorção cromática leve, sem dependências externas (sem Three.js).
 *
 * Performance: ~60fps em Chromium do Figma. Zero JS pesado.
 *
 * Props:
 *   - level: 0-3 (intensidade do blur/glow)
 *   - hover: boolean (ativa efeito hover)
 *   - glow: boolean (ativa borda luminosa)
 *   - className: string adicional
 *   - style: estilos inline
 *   - children: conteúdo
 */

import React, { useRef, useId } from 'react';
import './GlassSurface.css';

const LEVEL_CONFIG = {
  0: { blur: 8,  opacity: 0.03, borderOpacity: 0.06 },
  1: { blur: 12, opacity: 0.05, borderOpacity: 0.10 },
  2: { blur: 16, opacity: 0.08, borderOpacity: 0.15 },
  3: { blur: 24, opacity: 0.12, borderOpacity: 0.20 },
};

export default function GlassSurface({
  level = 1,
  hover = false,
  glow = false,
  className = '',
  style = {},
  children,
  as: Component = 'div',
  ...rest
}) {
  const uniqueId = useId();
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];

  const classNames = [
    'glass-surface',
    `glass-level-${level}`,
    hover ? 'glass-hover' : '',
    glow ? 'glass-glow' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component
      className={classNames}
      style={{
        '--glass-blur': `${config.blur}px`,
        '--glass-bg-opacity': config.opacity,
        '--glass-border-opacity': config.borderOpacity,
        ...style,
      }}
      {...rest}
    >
      {/* SVG Filter for chromatic displacement (only on level 2+) */}
      {level >= 2 && (
        <svg className="glass-svg-filter" aria-hidden="true">
          <defs>
            <filter id={`glass-displace-${uniqueId}`}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.015"
                numOctaves="2"
                seed="42"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={level === 3 ? 3 : 1.5}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      {/* Glow border effect */}
      {glow && <div className="glass-glow-border" />}

      {/* Content */}
      <div className="glass-content">{children}</div>
    </Component>
  );
}
