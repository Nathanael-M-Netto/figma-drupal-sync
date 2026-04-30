/**
 * @file FieldList.jsx
 * Lista de campos de uma variação de template.
 * Mostra nome, tipo (badge colorido), valor exemplo.
 */

import React from 'react';

const TYPE_COLORS = {
  TEXT: { bg: 'rgba(46, 160, 67, 0.15)', color: '#58d68d' },
  BOOLEAN: { bg: 'rgba(13, 153, 255, 0.15)', color: '#5dade2' },
  VARIANT: { bg: 'rgba(163, 113, 247, 0.12)', color: '#a371f7' },
  URL: { bg: 'rgba(255, 165, 0, 0.12)', color: '#ffa500' },
  SLOT: { bg: 'rgba(255, 255, 255, 0.06)', color: '#888' },
};

function FieldItem({ field, depth = 0 }) {
  const typeStyle = TYPE_COLORS[field.type] || TYPE_COLORS.TEXT;

  return (
    <>
      <div className="field-item" style={{ paddingLeft: `${12 + depth * 16}px` }}>
        <span
          className="field-type-badge"
          style={{ background: typeStyle.bg, color: typeStyle.color }}
        >
          {field.type}
        </span>
        <span className="field-name">{field.name}</span>
        {field.example && (
          <span className="field-example" title={String(field.example)}>
            {typeof field.example === 'boolean'
              ? field.example ? 'true' : 'false'
              : String(field.example).substring(0, 40)}
          </span>
        )}
      </div>
      {/* Render children (SLOT) recursivamente */}
      {field.children && field.children.map((child, i) => (
        <FieldItem key={`${child.name}-${i}`} field={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default function FieldList({ fields }) {
  if (!fields || fields.length === 0) {
    return (
      <div className="field-list-empty">
        Nenhum campo definido
      </div>
    );
  }

  return (
    <div className="field-list">
      <div className="field-list-header">
        <span>Tipo</span>
        <span>Nome</span>
        <span>Exemplo</span>
      </div>
      {fields.map((field, i) => (
        <FieldItem key={`${field.name}-${i}`} field={field} />
      ))}
    </div>
  );
}
