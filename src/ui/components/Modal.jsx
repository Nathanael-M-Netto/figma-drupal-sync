/**
 * @file Modal.jsx
 * Modal genérico com backdrop blur e animação slideUp.
 */

import React, { useRef } from 'react';

export default function Modal({ show, onClose, title, description, children }) {
  const overlayRef = useRef(null);

  if (!show) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{ display: 'flex' }}
    >
      <div className="modal-box">
        {title && <h3>{title}</h3>}
        {description && <p className="modal-desc">{description}</p>}
        {children}
      </div>
    </div>
  );
}
