import { isSafeImageUrl } from '../utils/image';

export const BLOCK_TYPES = [
  'paragraph',
  'heading-one',
  'heading-two',
  'heading-three',
  'bulleted-list',
  'numbered-list',
  'todo',
  'quote',
  'callout',
  'code',
  'divider',
  'image',
];
export const VOID_TYPES = ['divider', 'image'];
export const LIST_TYPES = ['bulleted-list', 'numbered-list', 'todo'];
export const HEADING_TYPES = ['heading-one', 'heading-two', 'heading-three'];
export const MARKS = ['bold', 'italic', 'underline', 'strikethrough', 'code'];
export const MAX_INDENT = 3;

export const emptyParagraph = () => ({ type: 'paragraph', children: [{ text: '' }] });

export function createBlock(type, extra = {}) {
  const node = { type, children: [{ text: '' }] };
  if (type === 'todo') node.checked = false;
  if (type === 'callout') node.emoji = '💡';
  if (type === 'image') node.url = '';
  return { ...node, ...extra };
}

function sanitizeText(node) {
  if (!node || typeof node.text !== 'string') return null;
  const text = { text: node.text };
  for (const mark of MARKS) if (node[mark] === true) text[mark] = true;
  return text;
}

function sanitizeBlock(node) {
  if (!node || typeof node !== 'object' || !BLOCK_TYPES.includes(node.type)) return null;
  const children = (Array.isArray(node.children) ? node.children : []).map(sanitizeText).filter(Boolean);
  const block = { type: node.type, children: children.length ? children : [{ text: '' }] };
  if (VOID_TYPES.includes(node.type)) block.children = [{ text: '' }];
  if (node.type === 'todo') block.checked = node.checked === true;
  if (node.type === 'callout') block.emoji = typeof node.emoji === 'string' ? node.emoji.slice(0, 8) : '💡';
  if (node.type === 'image') block.url = isSafeImageUrl(node.url) ? node.url : '';
  if (LIST_TYPES.includes(node.type) && Number.isInteger(node.indent) && node.indent > 0) {
    block.indent = Math.min(node.indent, MAX_INDENT);
  }
  return block;
}

/** Turns untrusted data (localStorage, shared links) into a valid flat block list. */
export function sanitizeContent(content) {
  const blocks = (Array.isArray(content) ? content : []).map(sanitizeBlock).filter(Boolean);
  return blocks.length ? blocks : [emptyParagraph()];
}
