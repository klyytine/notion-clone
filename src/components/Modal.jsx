import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

// Open modals, newest last, so Escape only closes the top one.
const stack = [];

export default function Modal({ title, onClose, children, footer, size = 'normal', className = '' }) {
  const id = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    stack.push(id);
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog.contains(document.activeElement)) {
      (dialog.querySelector('[autofocus], [data-autofocus]') || dialog).focus();
    }
    const onKey = (e) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id) {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      stack.splice(stack.indexOf(id), 1);
      document.removeEventListener('keydown', onKey);
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, [id]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={() => onCloseRef.current?.()}>
      <div
        ref={dialogRef}
        className={`modal modal-${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id={`${id}-title`} className="modal-title">{title}</h2>
          {onClose && (
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <Icon name="x" />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
