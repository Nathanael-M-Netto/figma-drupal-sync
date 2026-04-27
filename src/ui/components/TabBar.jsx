/**
 * @file TabBar.jsx
 * Barra de abas: Designer e Dev Settings.
 */

import React from 'react';

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="tab-bar">
      <button
        className={`tab-btn ${activeTab === 'ux' ? 'active' : ''}`}
        onClick={() => onTabChange('ux')}
      >
        Designer
      </button>
      <button
        className={`tab-btn ${activeTab === 'dev' ? 'active active-dev' : ''}`}
        onClick={() => onTabChange('dev')}
      >
        Dev Settings
      </button>
    </div>
  );
}
