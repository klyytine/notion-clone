import { useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { createEditor, Editor, Path, Range, Transforms } from 'slate';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { isCodeHotkey, isKeyHotkey } from 'is-hotkey';
import Element from './Element';
import Leaf from './Leaf';
import SlashMenu from './SlashMenu';
import HoverToolbar from './HoverToolbar';
import { withNotion } from './withNotion';
import { filterCommands } from './slashCommands';
import { changeIndent, exitBlock, getBlockEntry, insertBlock, setBlockType, toggleMark, toggleTodo } from './commands';

// Match on the physical key code and on event.key, so shortcuts work across keyboard layouts.
const isHotkey = (hotkey, event) => isCodeHotkey(hotkey, event) || isKeyHotkey(hotkey, event);

const MARK_HOTKEYS = [
  ['mod+b', 'bold'],
  ['mod+i', 'italic'],
  ['mod+u', 'underline'],
  ['mod+shift+x', 'strikethrough'],
  ['mod+e', 'code'],
];

// Notion: cmd+option+N on Mac, ctrl+shift+N on Windows/Linux. Both are accepted.
const BLOCK_HOTKEY_TYPES = ['paragraph', 'heading-one', 'heading-two', 'heading-three', 'todo', 'bulleted-list', 'numbered-list', 'quote', 'code'];
const BLOCK_HOTKEYS = BLOCK_HOTKEY_TYPES.flatMap((type, n) => [
  [`mod+alt+${n}`, type],
  [`mod+shift+${n}`, type],
]);

export default function BlockEditor({ initialValue, onChange, readOnly = false, apiRef, showLineNumbers = false }) {
  const editor = useMemo(() => withNotion(withHistory(withReact(createEditor()))), []);
  const [slash, setSlash] = useState(null); // { anchor, query, index }

  useImperativeHandle(
    apiRef,
    () => ({
      focusStart() {
        Transforms.select(editor, Editor.start(editor, []));
        ReactEditor.focus(editor);
      },
      focusEnd() {
        Transforms.select(editor, Editor.end(editor, []));
        ReactEditor.focus(editor);
      },
    }),
    [editor],
  );

  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const items = slash ? filterCommands(slash.query) : [];

  function updateSlashMenu() {
    const { selection, operations } = editor;
    const collapsed = selection && Range.isCollapsed(selection);

    if (slash) {
      const { anchor } = slash;
      if (!collapsed || !Path.equals(selection.anchor.path, anchor.path) || selection.anchor.offset <= anchor.offset) {
        setSlash(null);
        return;
      }
      const typed = Editor.string(editor, { anchor, focus: selection.anchor });
      const query = typed.slice(1);
      const tooLong = query.length > 24 || /\s{2}/.test(query);
      if (!typed.startsWith('/') || tooLong || (/\s/.test(query) && filterCommands(query).length === 0)) {
        setSlash(null);
      } else if (query !== slash.query) {
        setSlash({ anchor, query, index: 0 });
      }
      return;
    }

    const typedSlash = operations.some((op) => op.type === 'insert_text' && op.text === '/');
    if (!typedSlash || !collapsed || selection.anchor.offset < 1) return;
    if (getBlockEntry(editor)?.[0].type === 'code') return;
    const { path, offset } = selection.anchor;
    const charBefore = Editor.string(editor, { anchor: { path, offset: Math.max(0, offset - 2) }, focus: { path, offset: offset - 1 } });
    if (offset === 1 || /\s/.test(charBefore)) {
      setSlash({ anchor: { path, offset: offset - 1 }, query: '', index: 0 });
    }
  }

  function handleChange(value) {
    if (editor.operations.some((op) => op.type !== 'set_selection')) onChange?.(value);
    if (!readOnly) updateSlashMenu();
  }

  function runCommand(cmd) {
    if (!slash || !editor.selection) return;
    Transforms.delete(editor, { at: { anchor: slash.anchor, focus: editor.selection.anchor } });
    setSlash(null);
    insertBlock(editor, cmd.type);
    if (cmd.type !== 'image') ReactEditor.focus(editor);
  }

  function handleKeyDown(event) {
    if (slash) {
      const count = Math.max(items.length, 1);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setSlash((s) => ({ ...s, index: (s.index + step + count) % count }));
        return;
      }
      if ((event.key === 'Enter' || event.key === 'Tab') && items.length) {
        event.preventDefault();
        runCommand(items[Math.min(slash.index, items.length - 1)]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setSlash(null);
        return;
      }
    }

    for (const [hotkey, mark] of MARK_HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault();
        toggleMark(editor, mark);
        return;
      }
    }
    for (const [hotkey, type] of BLOCK_HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault();
        setBlockType(editor, type);
        return;
      }
    }

    const blockType = getBlockEntry(editor)?.[0].type;

    if (isHotkey('mod+enter', event)) {
      event.preventDefault();
      if (!toggleTodo(editor) && blockType === 'code') exitBlock(editor);
      return;
    }
    if (isHotkey('shift+enter', event)) {
      event.preventDefault();
      Transforms.insertText(editor, '\n');
      return;
    }
    if (isHotkey('tab', event)) {
      event.preventDefault();
      if (blockType === 'code') Transforms.insertText(editor, '  ');
      else changeIndent(editor, 1);
      return;
    }
    if (isHotkey('shift+tab', event)) {
      event.preventDefault();
      changeIndent(editor, -1);
    }
  }

  return (
    <div className={`editor ${showLineNumbers ? 'line-numbers' : ''}`}>
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        <Editable
          className="editor-content"
          readOnly={readOnly}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
          onBlur={() => setSlash(null)}
          spellCheck
          aria-label="Page content"
        />
        {!readOnly && <HoverToolbar />}
        {slash && (
          <SlashMenu
            editor={editor}
            anchor={slash.anchor}
            items={items}
            activeIndex={Math.min(slash.index, Math.max(items.length - 1, 0))}
            onSelect={runCommand}
            onHover={(index) => setSlash((s) => (s ? { ...s, index } : s))}
          />
        )}
      </Slate>
      {!readOnly && (
        <div
          className="editor-click-area"
          onClick={() => {
            const last = editor.children[editor.children.length - 1];
            if (last && Editor.string(editor, [editor.children.length - 1]) !== '') {
              Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '' }] }, { at: [editor.children.length] });
            }
            Transforms.select(editor, Editor.end(editor, []));
            ReactEditor.focus(editor);
          }}
        />
      )}
    </div>
  );
}
