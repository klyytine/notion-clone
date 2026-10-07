export const SLASH_COMMANDS = [
  { type: 'paragraph', label: 'Text', description: 'Just start writing with plain text.', icon: 'Aa', keywords: ['text', 'paragraph', 'plain'] },
  { type: 'heading-one', label: 'Heading 1', description: 'Big section heading.', icon: 'H1', keywords: ['h1', 'heading', 'title'] },
  { type: 'heading-two', label: 'Heading 2', description: 'Medium section heading.', icon: 'H2', keywords: ['h2', 'heading', 'subtitle'] },
  { type: 'heading-three', label: 'Heading 3', description: 'Small section heading.', icon: 'H3', keywords: ['h3', 'heading'] },
  { type: 'bulleted-list', label: 'Bulleted list', description: 'Create a simple bulleted list.', iconName: 'list', keywords: ['bullet', 'list', 'ul', 'unordered'] },
  { type: 'numbered-list', label: 'Numbered list', description: 'Create a list with numbering.', iconName: 'listOrdered', keywords: ['number', 'ordered', 'ol', 'list'] },
  { type: 'todo', label: 'To-do list', description: 'Track tasks with a to-do list.', iconName: 'checkSquare', keywords: ['todo', 'to-do', 'task', 'checkbox', 'check'] },
  { type: 'quote', label: 'Quote', description: 'Capture a quote.', iconName: 'quote', keywords: ['quote', 'blockquote', 'citation'] },
  { type: 'callout', label: 'Callout', description: 'Make writing stand out.', iconName: 'callout', keywords: ['callout', 'note', 'tip', 'warning'] },
  { type: 'code', label: 'Code', description: 'Capture a code snippet.', iconName: 'code', keywords: ['code', 'snippet', 'pre'] },
  { type: 'divider', label: 'Divider', description: 'Visually divide blocks.', iconName: 'divider', keywords: ['divider', 'hr', 'line', 'separator'] },
  { type: 'image', label: 'Image', description: 'Upload or embed with a link.', iconName: 'image', keywords: ['image', 'picture', 'photo', 'img'] },
];

export function filterCommands(query) {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (c) => c.label.toLowerCase().includes(q) || c.keywords.some((k) => k.startsWith(q)),
  );
}
