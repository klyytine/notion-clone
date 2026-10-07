import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReactEditor } from 'slate-react';
import Icon from '../components/Icon';
import { useT } from '../i18n';

const GAP = 6;
const MARGIN = 8;

export default function SlashMenu({ editor, anchor, items, activeIndex, onSelect, onHover }) {
  const t = useT();
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    function place() {
      try {
        const slashChar = { anchor, focus: { path: anchor.path, offset: anchor.offset + 1 } };
        const rect = ReactEditor.toDOMRange(editor, slashChar).getBoundingClientRect();
        const menu = ref.current;
        const height = menu?.offsetHeight ?? 320;
        const width = menu?.offsetWidth ?? 300;
        const fitsBelow = rect.bottom + GAP + height <= window.innerHeight - MARGIN;
        const top = fitsBelow || rect.top - GAP - height < MARGIN ? rect.bottom + GAP : rect.top - GAP - height;
        const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - width - MARGIN));
        setPos({ top, left });
      } catch {
        // The anchor can briefly point at a node that is being re-rendered.
      }
    }
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [editor, anchor, items.length]);

  useEffect(() => {
    ref.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return createPortal(
    <div
      ref={ref}
      className="popover slash-menu"
      style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}
      role="listbox"
      aria-label={t('editor.slashLabel')}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="popover-label">{items.length ? t('editor.basicBlocks') : t('editor.noResults')}</div>
      {items.map((cmd, i) => (
        <button
          key={cmd.type}
          type="button"
          role="option"
          aria-selected={i === activeIndex}
          data-active={i === activeIndex}
          className={`slash-item ${i === activeIndex ? 'active' : ''}`}
          onMouseEnter={() => onHover(i)}
          onClick={() => onSelect(cmd)}
        >
          <span className="slash-icon">{cmd.iconName ? <Icon name={cmd.iconName} size={20} /> : cmd.icon}</span>
          <span className="slash-text">
            <span className="slash-title">{cmd.label}</span>
            <span className="slash-desc">{cmd.description}</span>
          </span>
        </button>
      ))}
    </div>,
    document.body,
  );
}
