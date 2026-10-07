const t = (text, marks = {}) => ({ text, ...marks });
const block = (type, children, extra = {}) => ({ type, children: Array.isArray(children) ? children : [t(children)], ...extra });

export function createWelcomePage(makePage) {
  return makePage({
    id: 'welcome',
    title: 'Getting started',
    icon: '👋',
    content: [
      block('paragraph', [
        t('Welcome! Every line here is a '),
        t('block', { bold: true }),
        t('. Click anywhere and start typing — changes save automatically.'),
      ]),
      block('heading-two', 'Try these'),
      block('todo', [t('Type '), t('/', { code: true }), t(' on an empty line to open the command menu')], { checked: false }),
      block('todo', 'Hover over the title area to add an icon or a cover image', { checked: false }),
      block('todo', [t('Select some text to format it, or press '), t('Ctrl/⌘ + B', { code: true })], { checked: false }),
      block('todo', 'Click “Share” in the top bar to get a public read-only link', { checked: true }),
      block('heading-two', 'Markdown shortcuts'),
      block('bulleted-list', [t('#', { code: true }), t(', '), t('##', { code: true }), t(', '), t('###', { code: true }), t(' + space for headings')]),
      block('bulleted-list', [t('-', { code: true }), t(' or '), t('1.', { code: true }), t(' + space for lists, '), t('[]', { code: true }), t(' for a to-do')]),
      block('bulleted-list', [t('"', { code: true }), t(' + space for a quote, '), t('```', { code: true }), t(' for code, '), t('---', { code: true }), t(' for a divider')]),
      block('bulleted-list', [t('**bold**', { code: true }), t(', '), t('*italic*', { code: true }), t(', '), t('`code`', { code: true }), t(', '), t('~strike~', { code: true })]),
      block('bulleted-list', 'Press Tab / Shift+Tab to nest list items', { indent: 0 }),
      block('bulleted-list', 'Like this one', { indent: 1 }),
      block('callout', 'Everything is stored in this browser’s localStorage. Images are saved as base64, so no hosting is needed.', { emoji: '💡' }),
      block('quote', 'The best way to get started is to start.'),
      block('code', 'function hello(name) {\n  return `Hello, ${name}!`;\n}'),
      block('divider', ''),
      block('paragraph', ''),
    ],
  });
}
