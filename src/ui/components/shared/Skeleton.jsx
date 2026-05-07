/**
 * @file Skeleton.jsx
 * Componente skeleton loading para feedback visual durante carregamento.
 *
 * Variantes:
 *   - text: linha de texto com largura variável
 *   - card: card completo com header + linhas
 *   - list: lista de items
 *   - badge: badge circular
 */

import React from 'react';

function SkeletonLine({ width = '100%', height = '12px', style = {} }) {
  return (
    <div
      className="skeleton-line"
      style={{ width, height, ...style }}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <SkeletonLine width="60%" height="14px" />
      <SkeletonLine width="90%" style={{ marginTop: '10px' }} />
      <SkeletonLine width="75%" style={{ marginTop: '6px' }} />
      <SkeletonLine width="40%" style={{ marginTop: '6px' }} />
    </div>
  );
}

function SkeletonList({ rows = 3 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-list-item">
          <SkeletonLine width="14px" height="14px" style={{ borderRadius: '50%', flexShrink: 0 }} />
          <SkeletonLine width={`${65 + Math.random() * 30}%`} />
        </div>
      ))}
    </div>
  );
}

export default function Skeleton({ variant = 'card', rows = 3, count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => {
    switch (variant) {
      case 'text':
        return <SkeletonLine key={i} width={`${50 + Math.random() * 50}%`} />;
      case 'card':
        return <SkeletonCard key={i} />;
      case 'list':
        return <SkeletonList key={i} rows={rows} />;
      case 'badge':
        return <SkeletonLine key={i} width="60px" height="20px" style={{ borderRadius: '10px' }} />;
      default:
        return <SkeletonCard key={i} />;
    }
  });

  return <div className="skeleton-container">{items}</div>;
}
