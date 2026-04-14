import React from 'react';

const PermissionModal = ({ open, onClose, onRequest }) => {
  if (!open) return null;
  return (
    <div className="permission-overlay">
      <div className="permission-modal">
        <h3>Permisos de cámara y micrófono</h3>
        <p>Para mejorar la experiencia, solicitamos permiso para usar la cámara y el micrófono (no se usarán aquí realmente).</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="btn" onClick={onRequest}>Solicitar permisos</button>
          <button className="btn btn-ghost" onClick={onClose}>Continuar sin permisos</button>
        </div>
        <p style={{ marginTop: 10, color: '#6b7280' }}>Puedes rechazar y seguir con la demo.</p>
      </div>
    </div>
  );
};

export default PermissionModal;
