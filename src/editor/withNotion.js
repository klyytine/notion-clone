import { Editor, Element, Node, Path, Point, Range, Text, Transforms } from 'slate';
import { HEADING_TYPES, LIST_TYPES, MARKS, emptyParagraph } from './schema';
import { changeIndent, getBlockEntry, insertBlock, setBlockType } from './commands';
import { readImageFile } from '../utils/image';

// Typed at the start of a paragraph, followed by a space.
const BLOCK_SHORTCUTS = {
  '#': 'heading-one',
  '##': 'heading-two',
  '###': 'heading-three',
  '-': 'bulleted-list',
  '*': 'bulleted-list',
  '+': 'bulleted-list',
  '1.': 'numbered-list',
  '[]': 'todo',
  '"': 'quote',
  '>': 'quote',
};

// Typed on both sides of some text: **bold**, *italic*, `code`, ~strike~.
const INLINE_RULES = [
  { trigger: '*', re: /\*\*([^*\s](?:[^*]*[^*\s])?)\*\*$/, mark: 'bold' },
  { trigger: '*', re: /(?:^|[^*])\*([^*\s](?:[^*]*[^*\s])?)\*$/, mark: 'italic' },
  { trigger: '`', re: /`([^`]+)`$/, mark: 'code' },
  { trigger: '~', re: /~([^~\s](?:[^~]*[^~\s])?)~$/, mark: 'strikethrough' },
];

const SPLIT_TO_PARAGRAPH = [...HEADING_TYPES, 'quote', 'callout'];

function applyInlineMarkdown(editor, trigger) {
  const { anchor } = editor.selection;
  const leaf = Node.get(editor, anchor.path);
  const before = leaf.text.slice(0, anchor.offset);

  for (const rule of INLINE_RULES) {
    if (rule.trigger !== trigger) continue;
    const match = before.match(rule.re);
    if (!match) continue;

    const leadingChar = match[0].startsWith(trigger) ? 0 : 1;
    const startOffset = match.index + leadingChar;
    const inner = match[1];
    const start = { path: anchor.path, offset: startOffset };

    Transforms.delete(editor, { at: { anchor: start, focus: anchor } });
    Transforms.insertText(editor, inner, { at: start });
    Transforms.select(editor, {
      anchor: start,
      focus: { path: anchor.path, offset: startOffset + inner.length },
    });
    Editor.addMark(editor, rule.mark, true);
    Transforms.collapse(editor, { edge: 'end' });
    Editor.removeMark(editor, rule.mark);
    return;
  }
}

export function withNotion(editor) {
  const { isVoid, insertText, insertBreak, insertData, deleteBackward, normalizeNode } = editor;

  editor.isVoid = (element) => ['divider', 'image'].includes(element.type) || isVoid(element);

  editor.insertText = (text, options) => {
    const { selection } = editor;
    const entry = selection && Range.isCollapsed(selection) ? getBlockEntry(editor) : null;
    if (!entry || entry[0].type === 'code') {
      insertText(text, options);
      return;
    }

    const [node, path] = entry;
    const start = Editor.start(editor, path);
    const beforeRange = { anchor: start, focus: selection.anchor };
    const before = Editor.string(editor, beforeRange);

    if (node.type === 'paragraph') {
      const shortcut =
        (text === ' ' && BLOCK_SHORTCUTS[before]) ||
        (text === ']' && before === '[' && 'todo') ||
        (text === '`' && before === '``' && 'code');
      if (shortcut) {
        Transforms.delete(editor, { at: beforeRange });
        setBlockType(editor, shortcut, path);
        return;
      }
      if (text === '-' && before === '--' && Node.string(node) === '--') {
        Transforms.delete(editor, { at: beforeRange });
        insertBlock(editor, 'divider');
        return;
      }
    }

    insertText(text, options);
    if (INLINE_RULES.some((r) => r.trigger === text)) applyInlineMarkdown(editor, text);
  };

  editor.insertBreak = () => {
    const entry = getBlockEntry(editor);
    if (!entry) {
      insertBreak();
      return;
    }
    const [node, path] = entry;

    if (editor.isVoid(node)) {
      Transforms.insertNodes(editor, emptyParagraph(), { at: Path.next(path), select: true });
      return;
    }
    if (node.type === 'code') {
      Transforms.insertText(editor, '\n');
      return;
    }

    const isEmpty = Node.string(node) === '';
    if (isEmpty && LIST_TYPES.includes(node.type)) {
      if (!changeIndent(editor, -1) || !node.indent) setBlockType(editor, 'paragraph', path);
      return;
    }
    if (isEmpty && (node.type === 'quote' || node.type === 'callout')) {
      setBlockType(editor, 'paragraph', path);
      return;
    }

    // Enter at the very start of a filled block pushes an empty line above it.
    if (!isEmpty && Point.equals(editor.selection.anchor, Editor.start(editor, path))) {
      const aboveType = LIST_TYPES.includes(node.type) ? node.type : 'paragraph';
      const above = { ...emptyParagraph(), type: aboveType };
      if (aboveType === 'todo') above.checked = false;
      if (node.indent) above.indent = node.indent;
      Transforms.insertNodes(editor, above, { at: path, select: false });
      return;
    }

    insertBreak();
    const newEntry = getBlockEntry(editor);
    if (!newEntry) return;
    const [newNode, newPath] = newEntry;
    if (SPLIT_TO_PARAGRAPH.includes(newNode.type)) setBlockType(editor, 'paragraph', newPath);
    else if (newNode.type === 'todo' && newNode.checked) {
      Transforms.setNodes(editor, { checked: false }, { at: newPath });
    }
  };

  editor.deleteBackward = (unit) => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const entry = getBlockEntry(editor);
      if (entry) {
        const [node, path] = entry;
        const atStart = Point.equals(selection.anchor, Editor.start(editor, path));
        if (atStart && node.type !== 'paragraph' && !editor.isVoid(node)) {
          // Backspace at the start of a styled block first un-styles it.
          if (!(node.indent && changeIndent(editor, -1))) setBlockType(editor, 'paragraph', path);
          return;
        }
      }
    }
    deleteBackward(unit);
  };

  editor.insertData = (data) => {
    const images = Array.from(data.files || []).filter((f) => f.type.startsWith('image/'));
    if (images.length) {
      images.forEach((file) =>
        readImageFile(file)
          .then((url) => insertBlock(editor, 'image', { url }))
          .catch(() => {}),
      );
      return;
    }
    const entry = getBlockEntry(editor);
    const plain = data.getData('text/plain');
    if (entry?.[0].type === 'code' && plain) {
      Transforms.insertText(editor, plain);
      return;
    }
    insertData(data);
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (Editor.isEditor(node)) {
      const last = node.children[node.children.length - 1];
      // Always keep a writable line at the end so voids/code can be escaped.
      if (!last || !Element.isElement(last) || editor.isVoid(last) || last.type === 'code') {
        Transforms.insertNodes(editor, emptyParagraph(), { at: [node.children.length] });
        return;
      }
    }

    if (Element.isElement(node) && path.length === 1) {
      if (!node.type) {
        Transforms.setNodes(editor, { type: 'paragraph' }, { at: path });
        return;
      }
      if (node.type === 'code') {
        for (const [child, childPath] of Node.children(editor, path)) {
          if (Text.isText(child) && MARKS.some((m) => m in child)) {
            Transforms.unsetNodes(editor, MARKS, { at: childPath });
            return;
          }
        }
      }
    }

    // The document is a flat list of blocks: lift anything nested (e.g. from paste).
    if (Element.isElement(node) && path.length > 1) {
      Transforms.unwrapNodes(editor, { at: path });
      return;
    }

    normalizeNode(entry);
  };

  return editor;
}
