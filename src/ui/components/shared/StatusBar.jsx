/**
 * @file StatusBar.jsx
 * Barra de status animada com três variantes: info, success, error.
 */

import React from 'react';

export default function StatusBar({ text, type, visible }) {
  if (!visible || !text) return null;

  return (
    <div className={`status-bar ${type}`}>
      {text}
    </div>
  );
}
