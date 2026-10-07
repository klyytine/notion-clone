import { Editor, Element, Node, Path, Text, Transforms } from 'slate';
import { LIST_TYPES, MARKS, MAX_INDENT, VOID_TYPES, createBlock, emptyParagraph } from './schema';

const BLOCK_EXTRA_PROPS = ['checked', 'emoji', 'indent', 'url'];

export function getBlockEntry(editor, at = editor.selection) {
  if (!at) return null;
  return (
    Editor.above(editor, {
      at,
      voids: true,
      match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
      mode: 'lowest',
    }) ?? null
  );
}

export function isMarkActive(editor, mark) {
  const marks = Editor.marks(editor);
  return Boolean(marks?.[mark]);
}

export function toggleMark(editor, mark) {
  const entry = getBlockEntry(editor);
  if (!entry || entry[0].type === 'code') return;
  if (isMarkActive(editor, mark)) Editor.removeMark(editor, mark);
  else Editor.addMark(editor, mark, true);
}

export function setBlockType(editor, type, at) {
  const entry = at ? [Node.get(editor, at), at] : getBlockEntry(editor);
  if (!entry) return;
  const [node, path] = entry;
  if (editor.isVoid(node)) return;

  Editor.withoutNormalizing(editor, () => {
    const keepIndent = LIST_TYPES.includes(type);
    const stale = BLOCK_EXTRA_PROPS.filter((k) => k in node && !(k === 'indent' && keepIndent));
    if (stale.length) Transforms.unsetNodes(editor, stale, { at: path });
    const { children, ...props } = createBlock(type);
    Transforms.setNodes(editor, props, { at: path });
    if (type === 'code') {
      Transforms.unsetNodes(editor, MARKS, { at: path, match: Text.isText });
    }
  });
}

/** Changes list nesting. Returns true when the current block is indentable. */
export function changeIndent(editor, delta) {
  const entry = getBlockEntry(editor);
  if (!entry) return false;
  const [node, path] = entry;
  if (!LIST_TYPES.includes(node.type)) return false;
  const current = node.indent || 0;
  const next = Math.max(0, Math.min(MAX_INDENT, current + delta));
  if (next === current) return true;
  if (next === 0) Transforms.unsetNodes(editor, 'indent', { at: path });
  else Transforms.setNodes(editor, { indent: next }, { at: path });
  return true;
}

/**
 * Inserts a block the way Notion does: an empty current line is converted in
 * place, otherwise the new block goes underneath.
 */
export function insertBlock(editor, type, extra) {
  const entry = getBlockEntry(editor);
  if (!entry) return;
  const [node, path] = entry;
  const isEmpty = !editor.isVoid(node) && Node.string(node) === '';

  if (!VOID_TYPES.includes(type)) {
    if (isEmpty) {
      setBlockType(editor, type, path);
    } else {
      Transforms.insertNodes(editor, createBlock(type, extra), { at: Path.next(path), select: true });
    }
    return;
  }

  Editor.withoutNormalizing(editor, () => {
    const replaceCurrent = isEmpty && node.type === 'paragraph';
    const at = replaceCurrent ? path : Path.next(path);
    if (replaceCurrent) Transforms.removeNodes(editor, { at: path });
    Transforms.insertNodes(editor, createBlock(type, extra), { at });

    // Leave the caret on an empty line below the new void block.
    const after = Path.next(at);
    const next = Node.has(editor, after) ? Node.get(editor, after) : null;
    const reusable = next && next.type === 'paragraph' && Node.string(next) === '';
    if (!reusable) Transforms.insertNodes(editor, emptyParagraph(), { at: after });
    Transforms.select(editor, Editor.start(editor, after));
  });
}

export function toggleTodo(editor) {
  const entry = getBlockEntry(editor);
  if (!entry || entry[0].type !== 'todo') return false;
  Transforms.setNodes(editor, { checked: !entry[0].checked }, { at: entry[1] });
  return true;
}

export function exitBlock(editor) {
  const entry = getBlockEntry(editor);
  if (!entry) return;
  const at = Path.next(entry[1]);
  Transforms.insertNodes(editor, emptyParagraph(), { at, select: true });
}
