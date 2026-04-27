/**
 * @file NidBadge.jsx
 * Badge visual com o NID vinculado e dot animado de status.
 */

import React from 'react';

export default function NidBadge({ nid, small = false }) {
  const style = small
    ? { fontSize: '11px', padding: '5px 12px' }
    : {};

  return (
    <span className="nid-badge" style={style}>
      <span className="dot" />
      <span>{nid ? `NID ${nid}` : 'Nenhum'}</span>
    </span>
  );
}
