import { MAX_INDENT, createBlock, emptyParagraph, sanitizeContent } from '../editor/schema';
import { isSafeImageUrl } from '../utils/image';
import { baseName, extName } from './fileApi';

// Converts pages to and from files: native .note (lossless JSON), Markdown,
// plain text, and HTML (for pages opened from a web address).

export const SAVE_FORMATS = {
  note: { ext: '.note', label: 'Note (.note)' },
  md: { ext: '.md', label: 'Markdown (.md) — text only' },
};

export const OPENABLE_EXTENSIONS = ['.note', '.json', '.md', '.markdown', '.txt'];

export function formatFromPath(p) {
  switch (extName(p)) {
    case '.note':
    case '.json':
      return 'note';
    case '.md':
    case '.markdown':
      return 'md';
    case '.txt':
      return 'txt';
    case '.html':
    case '.htm':
      return 'html';
    default:
      return null;
  }
}

export function titleFromName(name) {
  return baseName(name)
    .replace(/\.(note|json|md|markdown|txt|html?)$/i, '')
    .trim();
}

/** Picks a parser for content fetched from a URL. */
export function detectFormat({ url = '', contentType = '', text = '' }) {
  const type = contentType.toLowerCase();
  if (type.includes('json')) return 'note';
  if (type.includes('markdown')) return 'md';
  if (type.includes('html')) return 'html';
  const fromPath = formatFromPath(new URL(url, 'http://x').pathname);
  if (fromPath) return fromPath;
  const start = text.trimStart();
  if (start.startsWith('{')) return 'note';
  if (start.startsWith('<')) return 'html';
  return 'txt';
}

// ───────────────────────── Writing ─────────────────────────

export function serializePage(page, format = 'note') {
  if (format === 'md') return toMarkdown(page);
  return JSON.stringify(
    {
      format: 'notes-page',
      version: 1,
      title: page.title,
      icon: page.icon,
      cover: page.cover,
      content: page.content,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    },
    null,
    2,
  );
}

function leafToMarkdown(leaf) {
  const match = leaf.text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const [, lead, core, trail] = match;
  if (!core) return leaf.text;
  let out = core;
  if (leaf.code) out = `\`${out}\``;
  if (leaf.bold) out = `**${out}**`;
  if (leaf.italic) out = `*${out}*`;
  if (leaf.strikethrough) out = `~~${out}~~`;
  if (leaf.underline) out = `<u>${out}</u>`;
  return lead + out + trail;
}

const inlineMarkdown = (block) => block.children.map(leafToMarkdown).join('');
const LIST_LIKE = ['bulleted-list', 'numbered-list', 'todo'];

function blockToMarkdown(block) {
  const text = inlineMarkdown(block);
  const indent = '  '.repeat(block.indent || 0);
  switch (block.type) {
    case 'heading-one':
      return `# ${text}`;
    case 'heading-two':
      return `## ${text}`;
    case 'heading-three':
      return `### ${text}`;
    case 'bulleted-list':
      return `${indent}- ${text}`;
    case 'numbered-list':
      return `${indent}1. ${text}`;
    case 'todo':
      return `${indent}- [${block.checked ? 'x' : ' '}] ${text}`;
    case 'quote':
      return text.split('\n').map((line) => `> ${line}`).join('\n');
    case 'callout':
      return text.split('\n').map((line, i) => `> ${i === 0 ? `${block.emoji || '💡'} ` : ''}${line}`).join('\n');
    case 'code':
      return `\`\`\`\n${block.children.map((c) => c.text).join('')}\n\`\`\``;
    case 'divider':
      return '---';
    case 'image':
      return block.url ? `![](${block.url})` : '';
    default:
      return text.replace(/\n/g, '  \n');
  }
}

export function toMarkdown(page) {
  const parts = [];
  if (page.title) parts.push(`# ${page.title}`, '');
  page.content.forEach((block, i) => {
    const previous = page.content[i - 1];
    if (i > 0 && !(LIST_LIKE.includes(block.type) && LIST_LIKE.includes(previous?.type))) parts.push('');
    parts.push(blockToMarkdown(block));
  });
  return `${parts.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

// ───────────────────────── Reading ─────────────────────────

export function parseDocument(text, { format, name = '', baseUrl = '' } = {}) {
  let doc;
  if (format === 'note') doc = fromNoteJson(text);
  else if (format === 'md') doc = fromMarkdown(text);
  else if (format === 'html') doc = fromHtml(text, baseUrl);
  else doc = fromPlainText(text);
  return {
    title: doc.title || titleFromName(name),
    icon: doc.icon || null,
    cover: isSafeImageUrl(doc.cover) ? doc.cover : null,
    content: sanitizeContent(doc.content),
  };
}

function fromNoteJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file isn’t a valid note (the JSON can’t be read).');
  }
  if (data?.format === 'notes-workspace') {
    throw new Error('This is a workspace file. To use it, choose its folder in Preferences → Storage.');
  }
  if (!data || !Array.isArray(data.content)) throw new Error('This file isn’t a note created by this app.');
  return {
    title: typeof data.title === 'string' ? data.title : '',
    icon: typeof data.icon === 'string' ? data.icon.slice(0, 16) : null,
    cover: data.cover,
    content: data.content,
  };
}

function fromPlainText(text) {
  const paragraphs = text.replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  return {
    content: paragraphs
      .map((p) => p.replace(/\s+$/, ''))
      .filter(Boolean)
      .map((p) => ({ type: 'paragraph', children: [{ text: p }] })),
  };
}

// Inline Markdown: **bold**, __bold__, *italic*, _italic_, `code`, ~~strike~~, <u>underline</u>, [text](url)
const INLINE_TOKEN = /(\*\*|__)(.+?)\1|~~(.+?)~~|`([^`]+)`|<u>(.+?)<\/u>|(\*|_)(?!\s)(.+?)(?<!\s)\6|!?\[([^\]]*)\]\([^)\s]+(?:\s+"[^"]*")?\)/g;
const unescapeMd = (s) => s.replace(/\\([\\`*_{}[\]()#+\-.!~>|])/g, '$1');

export function parseInlineMarkdown(text) {
  const leaves = [];
  let last = 0;
  for (const m of text.matchAll(INLINE_TOKEN)) {
    if (m.index > last) leaves.push({ text: unescapeMd(text.slice(last, m.index)) });
    if (m[2] !== undefined) leaves.push({ text: unescapeMd(m[2]), bold: true });
    else if (m[3] !== undefined) leaves.push({ text: unescapeMd(m[3]), strikethrough: true });
    else if (m[4] !== undefined) leaves.push({ text: m[4], code: true });
    else if (m[5] !== undefined) leaves.push({ text: unescapeMd(m[5]), underline: true });
    else if (m[7] !== undefined) leaves.push({ text: unescapeMd(m[7]), italic: true });
    else if (m[8] !== undefined) leaves.push({ text: unescapeMd(m[8]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) leaves.push({ text: unescapeMd(text.slice(last)) });
  const nonEmpty = leaves.filter((l) => l.text);
  return nonEmpty.length ? nonEmpty : [{ text: '' }];
}

const indentOf = (spaces) => Math.min(MAX_INDENT, Math.floor(spaces.replace(/\t/g, '    ').length / 2));

export function fromMarkdown(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let title = '';
  let icon = null;
  let i = 0;

  // YAML front matter: only title/icon are used.
  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((l, n) => n > 0 && l.trim() === '---');
    if (end > 0 && end < 40 && lines.slice(1, end).every((l) => !l.trim() || /^[\w-]+\s*:/.test(l))) {
      for (const line of lines.slice(1, end)) {
        const [, key, value] = line.match(/^([\w-]+)\s*:\s*(.*)$/) || [];
        if (key === 'title') title = value.replace(/^["']|["']$/g, '');
        if (key === 'icon') icon = value.replace(/^["']|["']$/g, '');
      }
      i = end + 1;
    }
  }

  let paragraph = null;
  let quote = null;
  const flush = () => {
    if (paragraph) blocks.push({ type: 'paragraph', children: parseInlineMarkdown(paragraph) });
    if (quote) blocks.push({ type: 'quote', children: parseInlineMarkdown(quote) });
    paragraph = null;
    quote = null;
  };

  for (; i < lines.length; i++) {
    const line = lines[i];

    const fence = line.match(/^\s*(```|~~~)/);
    if (fence) {
      flush();
      const code = [];
      for (i += 1; i < lines.length && !lines[i].trim().startsWith(fence[1]); i++) code.push(lines[i]);
      blocks.push({ type: 'code', children: [{ text: code.join('\n') }] });
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }

    let m;
    if ((m = line.match(/^\s*(#{1,6})\s+(.*?)\s*#*\s*$/))) {
      flush();
      const type = ['heading-one', 'heading-two', 'heading-three'][Math.min(m[1].length, 3) - 1];
      blocks.push({ type, children: parseInlineMarkdown(m[2]) });
    } else if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flush();
      blocks.push(createBlock('divider'));
    } else if ((m = line.match(/^\s*!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*$/)) && isSafeImageUrl(m[1])) {
      flush();
      blocks.push(createBlock('image', { url: m[1] }));
    } else if ((m = line.match(/^(\s*)[-*+]\s+\[( |x|X)\]\s+(.*)$/))) {
      flush();
      blocks.push({ type: 'todo', checked: m[2] !== ' ', indent: indentOf(m[1]), children: parseInlineMarkdown(m[3]) });
    } else if ((m = line.match(/^(\s*)[-*+]\s+(.*)$/))) {
      flush();
      blocks.push({ type: 'bulleted-list', indent: indentOf(m[1]), children: parseInlineMarkdown(m[2]) });
    } else if ((m = line.match(/^(\s*)\d+[.)]\s+(.*)$/))) {
      flush();
      blocks.push({ type: 'numbered-list', indent: indentOf(m[1]), children: parseInlineMarkdown(m[2]) });
    } else if ((m = line.match(/^\s*>\s?(.*)$/))) {
      if (paragraph) flush();
      quote = quote === null ? m[1] : `${quote}\n${m[1]}`;
    } else {
      if (quote !== null) flush();
      const hardBreak = paragraph !== null && /( {2,}|\\)$/.test(lines[i - 1]);
      const clean = line.trim().replace(/\\$/, '');
      paragraph = paragraph === null ? clean : `${paragraph.replace(/\\$/, '')}${hardBreak ? '\n' : ' '}${clean}`;
    }
  }
  flush();

  if (!title && blocks[0]?.type === 'heading-one') {
    title = blocks.shift().children.map((c) => c.text).join('');
  }
  return { title, icon, content: blocks };
}

// ───────────────────────── HTML (web pages) ─────────────────────────

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'NAV', 'FOOTER', 'HEADER', 'ASIDE', 'FORM', 'BUTTON', 'SVG', 'IFRAME', 'TEMPLATE', 'SELECT', 'INPUT', 'TEXTAREA', 'CANVAS', 'VIDEO', 'AUDIO']);
const BLOCK_TAGS = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'MAIN', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'BLOCKQUOTE', 'TABLE', 'HR', 'FIGURE', 'IMG', 'DL', 'DETAILS']);
const MARK_TAGS = { B: 'bold', STRONG: 'bold', I: 'italic', EM: 'italic', U: 'underline', S: 'strikethrough', DEL: 'strikethrough', STRIKE: 'strikethrough', CODE: 'code', KBD: 'code' };
const MAX_HTML_BLOCKS = 3000;

function inlineFromHtml(node, marks = {}, out = []) {
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent.replace(/\s+/g, ' ');
      if (text) out.push({ text, ...marks });
    } else if (child.nodeType === Node.ELEMENT_NODE && !SKIP_TAGS.has(child.tagName)) {
      if (child.tagName === 'BR') out.push({ text: '\n', ...marks });
      else if (child.tagName === 'UL' || child.tagName === 'OL' || child.tagName === 'IMG') continue;
      else inlineFromHtml(child, MARK_TAGS[child.tagName] ? { ...marks, [MARK_TAGS[child.tagName]]: true } : marks, out);
    }
  }
  return out;
}

function tidyLeaves(leaves) {
  const merged = [];
  for (const leaf of leaves) {
    const prev = merged[merged.length - 1];
    const sameMarks = prev && ['bold', 'italic', 'underline', 'strikethrough', 'code'].every((k) => !!prev[k] === !!leaf[k]);
    if (sameMarks) prev.text += leaf.text;
    else merged.push({ ...leaf });
  }
  if (merged.length) {
    merged[0].text = merged[0].text.replace(/^\s+/, '');
    merged[merged.length - 1].text = merged[merged.length - 1].text.replace(/\s+$/, '');
  }
  const nonEmpty = merged.filter((l) => l.text);
  return nonEmpty.length ? nonEmpty : null;
}

export function fromHtml(html, baseUrl) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = [];
  let title = doc.querySelector('title')?.textContent.trim() || '';
  const push = (block) => blocks.length < MAX_HTML_BLOCKS && blocks.push(block);

  const resolveImage = (src) => {
    try {
      const url = new URL(src, baseUrl || undefined).href;
      return isSafeImageUrl(url) ? url : null;
    } catch {
      return null;
    }
  };
  const textBlock = (type, el, extra = {}) => {
    const children = tidyLeaves(inlineFromHtml(el));
    if (children) push({ type, children, ...extra });
  };
  const walkList = (list, indent) => {
    const type = list.tagName === 'OL' ? 'numbered-list' : 'bulleted-list';
    for (const li of list.children) {
      if (li.tagName !== 'LI') continue;
      const checkbox = li.querySelector(':scope > input[type="checkbox"]');
      textBlock(checkbox ? 'todo' : type, li, checkbox ? { checked: checkbox.checked, indent } : { indent });
      for (const nested of li.querySelectorAll(':scope > ul, :scope > ol')) walkList(nested, Math.min(MAX_INDENT, indent + 1));
    }
  };

  const walk = (el) => {
    for (const child of el.children) {
      if (SKIP_TAGS.has(child.tagName) || child.hidden || child.getAttribute('aria-hidden') === 'true') continue;
      switch (child.tagName) {
        case 'H1':
          textBlock('heading-one', child);
          break;
        case 'H2':
          textBlock('heading-two', child);
          break;
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6':
          textBlock('heading-three', child);
          break;
        case 'UL':
        case 'OL':
          walkList(child, 0);
          break;
        case 'PRE':
          push({ type: 'code', children: [{ text: child.textContent.replace(/\n$/, '') }] });
          break;
        case 'BLOCKQUOTE':
          textBlock('quote', child);
          break;
        case 'HR':
          push(createBlock('divider'));
          break;
        case 'IMG': {
          const url = resolveImage(child.getAttribute('src') || '');
          if (url) push(createBlock('image', { url }));
          break;
        }
        case 'TABLE':
          for (const row of child.querySelectorAll('tr')) {
            const cells = [...row.children].map((c) => c.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
            if (cells.length) push({ type: 'paragraph', children: [{ text: cells.join(' | ') }] });
          }
          break;
        default: {
          const hasBlocks = [...child.children].some((c) => BLOCK_TAGS.has(c.tagName));
          if (hasBlocks) walk(child);
          else if (child.tagName === 'P' || child.textContent.trim()) {
            textBlock('paragraph', child);
            for (const img of child.querySelectorAll('img')) {
              const url = resolveImage(img.getAttribute('src') || '');
              if (url) push(createBlock('image', { url }));
            }
          }
        }
      }
    }
  };

  const root = doc.querySelector('article') || doc.querySelector('main') || doc.body;
  if (root) walk(root);
  if (!title && blocks[0]?.type === 'heading-one') title = blocks.shift().children.map((c) => c.text).join('');
  else if (title && blocks[0]?.type === 'heading-one' && blocks[0].children.map((c) => c.text).join('').trim() === title) blocks.shift();
  return { title, content: blocks.length ? blocks : [emptyParagraph()] };
}

// ───────────────────────── Statistics ─────────────────────────

const TEXT_BLOCKS = new Set(['paragraph', 'heading-one', 'heading-two', 'heading-three', 'bulleted-list', 'numbered-list', 'todo', 'quote', 'callout', 'code']);

export function countStats(content) {
  let words = 0;
  let characters = 0;
  let paragraphs = 0;
  for (const block of content) {
    if (!TEXT_BLOCKS.has(block.type)) continue;
    const text = block.children.map((c) => c.text).join('');
    if (!text.trim()) continue;
    paragraphs += 1;
    characters += [...text.replace(/\n/g, '')].length;
    words += text.trim().split(/\s+/).length;
  }
  return { words, characters, paragraphs };
}
