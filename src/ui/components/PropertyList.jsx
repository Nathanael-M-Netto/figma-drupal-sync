/**
 * @file PropertyList.jsx
 * Renderiza a lista de propriedades extraídas com badges de tipo.
 */

import React from 'react';

export default function PropertyList({ data, meta }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="prop-list">
        <div
          className="prop-item"
          style={{ color: 'var(--text-tertiary)', justifyContent: 'center' }}
        >
          Nenhum dado extraído
        </div>
      </div>
    );
  }

  return (
    <div className="prop-list">
      {Object.entries(data).map(([key, value]) => {
        const m = meta ? meta[key] : null;
        const valClass = m && !m.found ? 'prop-value missing' : 'prop-value';

        let display;
        if (value === null) display = '[N/A]';
        else if (typeof value === 'object') display = JSON.stringify(value);
        else display = String(value);

        return (
          <div key={key} className="prop-item">
            {m && (
              <span className={`type-badge badge-${m.type}`}>
                {m.type}
              </span>
            )}
            <div>
              <span className="prop-name">{key}:</span>{' '}
              <span className={valClass}>{display}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
