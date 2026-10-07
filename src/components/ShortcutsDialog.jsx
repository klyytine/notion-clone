import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SHORTCUT_GROUPS } from '../help/shortcuts';
import Icon from './Icon';

export default function ShortcutsDialog({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id="shortcuts-title" className="modal-title">Keyboard shortcuts</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.title} className="shortcut-group">
            <h3>{group.title}</h3>
            {group.rows.map(([keys, label]) => (
              <div key={label} className="shortcut-row">
                <span>{label}</span>
                <kbd>{keys}</kbd>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>,
    document.body,
  );
}
