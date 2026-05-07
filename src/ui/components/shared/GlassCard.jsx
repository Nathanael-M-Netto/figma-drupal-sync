/**
 * @file GlassCard.jsx
 * Wrapper pré-configurado de GlassSurface para uso como card.
 *
 * Simplifica o uso do GlassSurface para os casos mais comuns:
 *   - Cards de módulo, variação, propriedade
 *   - Painéis de informação
 *   - Containers de seção
 *
 * Props:
 *   - level: 0-3 (default: 1)
 *   - hover: boolean (default: true)
 *   - glow: boolean (default: false)
 *   - padding: string (default: '16px')
 *   - children: conteúdo
 */

import React from 'react';
import GlassSurface from './GlassSurface';

export default function GlassCard({
  level = 1,
  hover = true,
  glow = false,
  padding = '16px',
  className = '',
  children,
  ...rest
}) {
  return (
    <GlassSurface
      level={level}
      hover={hover}
      glow={glow}
      className={`glass-card ${className}`}
      style={{ padding }}
      {...rest}
    >
      {children}
    </GlassSurface>
  );
}
