import { ALT_LABEL, MOD_LABEL } from '../utils/platform';

const M = MOD_LABEL;
const A = ALT_LABEL;

// Single source for the Shortcuts dialog and the Help page.
export const SHORTCUT_GROUPS = [
  {
    title: 'Text formatting',
    rows: [
      [`${M} B`, 'Bold'],
      [`${M} I`, 'Italic'],
      [`${M} U`, 'Underline'],
      [`${M} Shift X`, 'Strikethrough'],
      [`${M} E`, 'Inline code'],
    ],
  },
  {
    title: 'Blocks',
    rows: [
      ['/', 'Open the command menu'],
      [`${M} ${A} 0`, 'Text'],
      [`${M} ${A} 1 / 2 / 3`, 'Heading 1 / 2 / 3'],
      [`${M} ${A} 4`, 'To-do'],
      [`${M} ${A} 5 / 6`, 'Bulleted / numbered list'],
      [`${M} ${A} 7`, 'Quote'],
      [`${M} ${A} 8`, 'Code'],
      ['Tab / Shift Tab', 'Indent / outdent list item'],
      [`${M} Enter`, 'Toggle to-do · leave code block'],
      ['Shift Enter', 'Line break inside a block'],
    ],
  },
  {
    title: 'App',
    rows: [
      [`${M} ${A === '⌥' ? '⌥' : 'Alt'} N`, 'New page'],
      [`${M} Shift L`, 'Toggle dark mode'],
      [`${M} \\`, 'Toggle sidebar'],
      [`${M} Z / ${M} Shift Z`, 'Undo / redo'],
    ],
  },
  {
    title: 'File',
    rows: [
      [`${M} O`, 'Open file'],
      [`${M} S`, 'Save'],
      [`${M} Shift S`, 'Save as'],
      ['F2', 'Rename page'],
      [`${M} P`, 'Print'],
      [`${M} ,`, 'Preferences'],
      [`${M} Q`, 'Quit'],
    ],
  },
];
