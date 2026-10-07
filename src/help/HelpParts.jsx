import Icon from '../components/Icon';
import { getSlashCommands } from '../editor/slashCommands';
import { t } from '../i18n';
import { getShortcutGroups } from './shortcuts';

// Building blocks shared by the help content in every language.

export function KeyTable({ rows }) {
  return (
    <div className="help-table">
      {rows.map(([keys, label]) => (
        <div key={keys} className="help-row">
          <kbd>{keys}</kbd>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function CommandList() {
  return (
    <div className="help-commands">
      {getSlashCommands().map((cmd) => (
        <div key={cmd.type} className="help-command">
          <span className="slash-icon">{cmd.iconName ? <Icon name={cmd.iconName} size={20} /> : cmd.icon}</span>
          <span className="slash-text">
            <span className="slash-title">{cmd.label}</span>
            <span className="slash-desc">{cmd.description}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function ShortcutGroups() {
  return getShortcutGroups().map((group) => (
    <div key={group.id} className="help-shortcut-group">
      <h3>{group.title}</h3>
      <KeyTable rows={group.rows} />
    </div>
  ));
}

export const formattingRows = () => getShortcutGroups().find((g) => g.id === 'formatting').rows;
export const newPageKeys = () => getShortcutGroups().find((g) => g.id === 'app').rows[0][0];

/** Markdown shortcuts typed at the start of a line, followed by a space. */
export const blockShortcutRows = () => [
  ['#', t('blocks.heading-one.label')],
  ['##', t('blocks.heading-two.label')],
  ['###', t('blocks.heading-three.label')],
  ['-  *  +', t('blocks.bulleted-list.label')],
  ['1.', t('blocks.numbered-list.label')],
  ['"  >', t('blocks.quote.label')],
];

/** Markdown shortcuts that convert as soon as they're typed. */
export const instantShortcutRows = () => [
  ['[]', t('blocks.todo.label')],
  ['```', t('blocks.code.label')],
  ['---', t('blocks.divider.label')],
];

export const inlineShortcutRows = (sample) => [
  [`**${sample}**`, <strong key="b">{t('marks.bold')}</strong>],
  [`*${sample}*`, <em key="i">{t('marks.italic')}</em>],
  [`\`${sample}\``, <code key="c" className="inline-code">{t('marks.code')}</code>],
  [`~${sample}~`, <s key="s">{t('marks.strikethrough')}</s>],
];

export const InlineIcon = ({ name }) => <Icon name={name} size={14} className="inline-icon" />;
