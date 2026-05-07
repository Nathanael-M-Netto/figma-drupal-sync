/**
 * @file NodeFieldsForm.jsx
 * Formulário dinâmico de campos do content-type do Drupal.
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Database } from 'lucide-react';

const FIELD_RENDERERS = {
  string: ({ field, value, onChange }) => (
    <Input
      type="text"
      placeholder={field.description || field.label}
      value={value || ''}
      onChange={(e) => onChange(field.name, e.target.value)}
      className="mt-1.5"
    />
  ),

  boolean: ({ field, value, onChange }) => (
    <label className="flex items-center gap-3 cursor-pointer mt-2">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={!!value}
          onChange={(e) => onChange(field.name, e.target.checked)}
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${value ? 'bg-brand' : 'bg-black/30'}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${value ? 'translate-x-4' : ''}`}></div>
      </div>
      <span className="text-[11px] font-semibold text-text-primary">{value ? 'Sim' : 'Não'}</span>
    </label>
  ),

  text_formatted: ({ field, value, onChange }) => (
    <textarea
      className="w-full mt-1.5 py-2.5 px-3 bg-bg-secondary border border-border text-text-primary rounded-[var(--radius-sm)] font-sans text-xs outline-none transition-colors focus:border-brand min-h-[80px] resize-y"
      placeholder={field.description || field.label}
      value={value || ''}
      rows={3}
      onChange={(e) => onChange(field.name, e.target.value)}
    />
  ),

  list_string: ({ field, value, onChange }) => (
    <select
      className="w-full mt-1.5 py-2.5 px-3 bg-bg-secondary border border-border text-text-primary rounded-[var(--radius-sm)] font-sans text-xs outline-none transition-colors focus:border-brand appearance-none cursor-pointer"
      value={value || ''}
      onChange={(e) => onChange(field.name, e.target.value)}
      style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto' }}
    >
      <option value="">Selecione...</option>
      {(field.options || []).map((opt) => (
        <option key={opt.value || opt} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  ),
};

export default function NodeFieldsForm({ schema, values, autoFilledFields, onChange }) {
  if (!schema || !schema.fields || schema.fields.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 rounded-[var(--radius-sm)] border border-dashed border-border bg-black/10 text-[11px] text-text-tertiary">
        <span>Nenhum campo adicional necessário</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 mb-2">
        <h4 className="flex items-center gap-2 m-0 text-sm font-bold text-text-primary">
          <Database className="w-4 h-4 text-brand" />
          Campos do Content-Type
        </h4>
        <span className="text-[11px] text-text-secondary">
          Preencha os campos obrigatórios do node Drupal
        </span>
      </div>

      {schema.fields.map((field) => {
        const Renderer = FIELD_RENDERERS[field.type] || FIELD_RENDERERS.string;
        const isRequired = field.required || field.required_inferred;
        const isAutoFilled = autoFilledFields && autoFilledFields[field.name];
        const value = values[field.name] ?? field.default_value ?? '';

        return (
          <div key={field.name} className="flex flex-col mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-text-primary">{field.label || field.name}</span>
              {isRequired && <span className="text-danger font-bold">*</span>}
              {isAutoFilled && (
                <span className="text-[9px] bg-success-soft text-success px-1.5 py-0.5 rounded font-bold uppercase tracking-[0.5px]">Auto-detectado ✅</span>
              )}
            </div>
            <Renderer field={field} value={value} onChange={onChange} />
            {field.description && (
              <span className="text-[10px] text-text-tertiary mt-1.5 leading-relaxed">{field.description}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
