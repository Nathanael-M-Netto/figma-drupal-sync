/**
 * @file utils.js
 * Funções utilitárias do design system.
 * cn() é o padrão shadcn/ui para merge condicional de classes Tailwind.
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge condicional de classes CSS com resolução de conflitos Tailwind.
 * @param  {...any} inputs - Classes, condicionais, arrays
 * @returns {string} String de classes final
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
