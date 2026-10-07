import { t } from '../i18n';
import { ALT_LABEL, MOD_LABEL } from '../utils/platform';

const M = MOD_LABEL;
const A = ALT_LABEL;

// Single source for the Shortcuts dialog and the Help page.
// A function, so labels are read in the current language.
export function getShortcutGroups() {
  return [
    {
      id: 'formatting',
      title: t('shortcuts.groups.formatting'),
      rows: [
        [`${M} B`, t('marks.bold')],
        [`${M} I`, t('marks.italic')],
        [`${M} U`, t('marks.underline')],
        [`${M} Shift X`, t('marks.strikethrough')],
        [`${M} E`, t('marks.code')],
      ],
    },
    {
      id: 'blocks',
      title: t('shortcuts.groups.blocks'),
      rows: [
        ['/', t('shortcuts.openMenu')],
        [`${M} ${A} 0`, t('blocks.paragraph.label')],
        [`${M} ${A} 1 / 2 / 3`, t('shortcuts.headings')],
        [`${M} ${A} 4`, t('blocks.todo.label')],
        [`${M} ${A} 5 / 6`, t('shortcuts.lists')],
        [`${M} ${A} 7`, t('blocks.quote.label')],
        [`${M} ${A} 8`, t('blocks.code.label')],
        ['Tab / Shift Tab', t('shortcuts.indent')],
        [`${M} Enter`, t('shortcuts.toggleTodo')],
        ['Shift Enter', t('shortcuts.lineBreak')],
      ],
    },
    {
      id: 'app',
      title: t('shortcuts.groups.app'),
      rows: [
        [`${M} ${A === '⌥' ? '⌥' : 'Alt'} N`, t('shortcuts.newPage')],
        [`${M} Shift L`, t('shortcuts.darkMode')],
        [`${M} \\`, t('shortcuts.sidebar')],
        [`${M} Z / ${M} Shift Z`, t('shortcuts.undoRedo')],
      ],
    },
    {
      id: 'file',
      title: t('shortcuts.groups.file'),
      rows: [
        [`${M} O`, t('shortcuts.openFile')],
        [`${M} S`, t('shortcuts.save')],
        [`${M} Shift S`, t('shortcuts.saveAs')],
        ['F2', t('shortcuts.rename')],
        [`${M} P`, t('shortcuts.print')],
        [`${M} ,`, t('shortcuts.preferences')],
        [`${M} Q`, t('shortcuts.quit')],
      ],
    },
  ];
}
