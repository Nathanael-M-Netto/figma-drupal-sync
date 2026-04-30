/**
 * @file TemplateSearch.jsx
 * Campo de busca e filtro para o catálogo de templates.
 */

import React, { useState, useEffect, useRef } from 'react';

export default function TemplateSearch({ searchQuery, onSearchChange, typeFilter, onTypeChange }) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(localQuery);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [localQuery]);

  return (
    <div className="template-search">
      <div className="search-field">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          className="input-field search-input"
          placeholder="Buscar módulo ou variação..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
        />
        {localQuery && (
          <button
            className="search-clear"
            onClick={() => { setLocalQuery(''); onSearchChange(''); }}
          >
            ×
          </button>
        )}
      </div>

      <div className="search-filters">
        {['', 'hero', 'cards', 'banner'].map((filter) => (
          <button
            key={filter}
            className={`filter-chip ${typeFilter === filter ? 'filter-chip-active' : ''}`}
            onClick={() => onTypeChange(filter)}
          >
            {filter || 'Todos'}
          </button>
        ))}
      </div>
    </div>
  );
}
