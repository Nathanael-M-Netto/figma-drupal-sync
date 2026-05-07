/**
 * @file TemplateSearch.jsx
 * Campo de busca e filtro para o catálogo de templates.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-col gap-3 mt-1 mb-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <Input
          type="text"
          className="pl-9 pr-9"
          placeholder="Buscar módulo ou variação..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
        />
        {localQuery && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-transparent border-none text-text-tertiary hover:text-text-primary hover:bg-black/10 cursor-pointer transition-colors"
            onClick={() => { setLocalQuery(''); onSearchChange(''); }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['', 'hero', 'cards', 'banner'].map((filter) => (
          <Button
            key={filter}
            variant={typeFilter === filter ? 'primary' : 'outline'}
            size="sm"
            className="capitalize rounded-full whitespace-nowrap h-7 text-[11px]"
            onClick={() => onTypeChange(filter)}
          >
            {filter || 'Todos'}
          </Button>
        ))}
      </div>
    </div>
  );
}
