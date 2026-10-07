import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../i18n';

export default function ConfirmDialog({ title, message, confirmLabel, danger = false, onConfirm, onCancel }) {
  const t = useT();
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="modal-title">{title}</h2>
        {message && <p className="modal-message">{message}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>{t('common.cancel')}</button>
          <button type="button" ref={confirmRef} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel ?? t('common.ok')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
