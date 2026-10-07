import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Editor, Range } from 'slate';
import { useFocused, useSlate } from 'slate-react';
import { getBlockEntry, isMarkActive, toggleMark } from './commands';
import { MOD_LABEL } from '../utils/platform';

const BUTTONS = [
  { mark: 'bold', label: 'B', title: `Bold (${MOD_LABEL}+B)` },
  { mark: 'italic', label: 'i', title: `Italic (${MOD_LABEL}+I)` },
  { mark: 'underline', label: 'U', title: `Underline (${MOD_LABEL}+U)` },
  { mark: 'strikethrough', label: 'S', title: `Strikethrough (${MOD_LABEL}+Shift+X)` },
  { mark: 'code', label: '</>', title: `Inline code (${MOD_LABEL}+E)` },
];

/** Formatting bar that floats above a text selection, like Notion's. */
export default function HoverToolbar() {
  const editor = useSlate();
  const focused = useFocused();
  const ref = useRef(null);
  const { selection } = editor;

  const visible =
    focused &&
    selection &&
    !Range.isCollapsed(selection) &&
    Editor.string(editor, selection) !== '' &&
    getBlockEntry(editor)?.[0].type !== 'code';

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const domSelection = window.getSelection();
    if (!visible || !domSelection || domSelection.rangeCount === 0) {
      el.classList.remove('visible');
      return;
    }
    const rect = domSelection.getRangeAt(0).getBoundingClientRect();
    const top = rect.top - el.offsetHeight - 8;
    const left = rect.left + rect.width / 2 - el.offsetWidth / 2;
    el.style.top = `${top < 8 ? rect.bottom + 8 : top}px`;
    el.style.left = `${Math.max(8, Math.min(left, window.innerWidth - el.offsetWidth - 8))}px`;
    el.classList.add('visible');
  });

  return createPortal(
    <div ref={ref} className="popover hover-toolbar" onMouseDown={(e) => e.preventDefault()} role="toolbar" aria-label="Text formatting">
      {BUTTONS.map(({ mark, label, title }) => (
        <button
          key={mark}
          type="button"
          title={title}
          aria-label={title}
          aria-pressed={isMarkActive(editor, mark)}
          className={`toolbar-btn mark-${mark} ${isMarkActive(editor, mark) ? 'active' : ''}`}
          onClick={() => toggleMark(editor, mark)}
        >
          {label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
