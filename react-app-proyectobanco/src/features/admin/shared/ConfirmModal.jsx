const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
          <button
            className="btn-save"
            style={{ background: 'linear-gradient(135deg,#c0392b,#e05c5c)', color: '#fff' }}
            onClick={onConfirm}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
