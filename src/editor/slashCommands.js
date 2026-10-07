import { t } from '../i18n';

// Keywords in both languages, so "/todo" and "/tehtävä" work whichever language is selected.
const COMMANDS = [
  { type: 'paragraph', icon: 'Aa', keywords: ['text', 'paragraph', 'plain', 'teksti', 'tyhjä', 'kappale'] },
  { type: 'heading-one', icon: 'H1', keywords: ['h1', 'heading', 'title', 'otsikko1', 'otsikko'] },
  { type: 'heading-two', icon: 'H2', keywords: ['h2', 'heading', 'subtitle', 'otsikko2', 'otsikko'] },
  { type: 'heading-three', icon: 'H3', keywords: ['h3', 'heading', 'otsikko3', 'otsikko'] },
  { type: 'bulleted-list', iconName: 'list', keywords: ['bullet', 'list', 'ul', 'unordered', 'luettelo', 'lista'] },
  { type: 'numbered-list', iconName: 'listOrdered', keywords: ['number', 'ordered', 'ol', 'list', 'numerolista', 'numeroitu', 'luettelo'] },
  { type: 'todo', iconName: 'checkSquare', keywords: ['todo', 'to-do', 'task', 'checkbox', 'check', 'tehtävä', 'tehtävälista', 'valintaruutu'] },
  { type: 'quote', iconName: 'quote', keywords: ['quote', 'blockquote', 'citation', 'lainaus', 'sitaatti'] },
  { type: 'callout', iconName: 'callout', keywords: ['callout', 'note', 'tip', 'warning', 'huomio', 'huomiolohko', 'vinkki', 'varoitus'] },
  { type: 'code', iconName: 'code', keywords: ['code', 'snippet', 'pre', 'koodi', 'koodilohko'] },
  { type: 'divider', iconName: 'divider', keywords: ['divider', 'hr', 'line', 'separator', 'jakaja', 'viiva', 'erotin'] },
  { type: 'image', iconName: 'image', keywords: ['image', 'picture', 'photo', 'img', 'kuva', 'valokuva'] },
];

/** The slash menu commands with labels in the current language. */
export function getSlashCommands() {
  return COMMANDS.map((c) => ({ ...c, label: t(`blocks.${c.type}.label`), description: t(`blocks.${c.type}.description`) }));
}

export function filterCommands(query) {
  const q = query.trim().toLowerCase();
  const commands = getSlashCommands();
  if (!q) return commands;
  return commands.filter((c) => c.label.toLowerCase().includes(q) || c.keywords.some((k) => k.startsWith(q)));
}
