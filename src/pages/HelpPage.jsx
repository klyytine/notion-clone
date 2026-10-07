import Icon from '../components/Icon';
import { SLASH_COMMANDS } from '../editor/slashCommands';
import { SHORTCUT_GROUPS } from '../help/shortcuts';
import { MOD_LABEL } from '../utils/platform';

const M = MOD_LABEL;

const SECTIONS = [
  ['basics', 'Basics'],
  ['pages', 'Pages'],
  ['header', 'Icon, cover & title'],
  ['commands', 'Slash commands'],
  ['markdown', 'Markdown shortcuts'],
  ['editing', 'Editing blocks'],
  ['formatting', 'Text formatting'],
  ['files', 'Files'],
  ['saving', 'Saving'],
  ['preferences', 'Preferences'],
  ['sharing', 'Sharing'],
  ['shortcuts', 'Keyboard shortcuts'],
];

const BLOCK_SHORTCUTS = [
  ['#', 'Heading 1'],
  ['##', 'Heading 2'],
  ['###', 'Heading 3'],
  ['-  *  +', 'Bulleted list'],
  ['1.', 'Numbered list'],
  ['"  >', 'Quote'],
];

const INSTANT_SHORTCUTS = [
  ['[]', 'To-do'],
  ['```', 'Code block'],
  ['---', 'Divider'],
];

const INLINE_SHORTCUTS = [
  ['**text**', <strong key="b">bold</strong>],
  ['*text*', <em key="i">italic</em>],
  ['`text`', <code key="c" className="inline-code">code</code>],
  ['~text~', <s key="s">strikethrough</s>],
];

function scrollToSection(event, id) {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function KeyTable({ rows }) {
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

export default function HelpPage() {
  return (
    <article className="page help-page">
      <header className="help-header">
        <div className="help-header-icon">
          <Icon name="help" size={40} />
        </div>
        <h1 className="help-title">Help</h1>
        <p className="help-lead">
          How to write, organize and share notes. Every line on a page is a <strong>block</strong>, and you can turn
          any block into a heading, list, to-do, code and more.
        </p>
      </header>

      <div className="help-body">
        <nav className="help-toc" aria-label="On this page">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={(e) => scrollToSection(e, id)}>
              {label}
            </a>
          ))}
        </nav>

        <section id="basics" className="help-section">
          <h2>Basics</h2>
          <ol className="help-steps">
            <li>Click <b>+ New Page</b> in the sidebar.</li>
            <li>Type a title, then press <kbd>Enter</kbd> to move into the page.</li>
            <li>Start writing. Press <kbd>Enter</kbd> for a new block.</li>
            <li>Type <kbd>/</kbd> on an empty line to choose a block type.</li>
          </ol>
          <p>Everything saves automatically while you type.</p>
        </section>

        <section id="pages" className="help-section">
          <h2>Pages</h2>
          <ul>
            <li><b>Create:</b> click <b>+ New Page</b> in the sidebar, or press <kbd>{SHORTCUT_GROUPS[2].rows[0][0]}</kbd>.</li>
            <li><b>Open:</b> click a page in the sidebar. The open page is highlighted.</li>
            <li>
              <b>Delete:</b> hover a page in the sidebar and click the <Icon name="trash" size={14} className="inline-icon" /> button,
              then confirm. Deleting can’t be undone.
            </li>
            <li><b>Hide the sidebar:</b> click <Icon name="menu" size={14} className="inline-icon" /> in the top bar, or press <kbd>{M} \</kbd>.</li>
          </ul>
        </section>

        <section id="header" className="help-section">
          <h2>Icon, cover & title</h2>
          <p>Hover over the top of a page to show <b>Add icon</b> and <b>Add cover</b>.</p>
          <ul>
            <li><b>Title:</b> click it to edit. Pages without a title show as “Untitled”.</li>
            <li>
              <b>Icon:</b> pick from 30 emojis, or click <b>Random</b>. Click an existing icon to change it or choose{' '}
              <b>Remove</b>. Click outside the picker to close it.
            </li>
            <li>
              <b>Cover:</b> either <b>Upload Image</b> from your computer, or paste an image link and click{' '}
              <b>Add Link</b>. Hover a cover to <b>Change cover</b> or <b>Remove cover</b>.
            </li>
          </ul>
          <p className="help-note">Uploaded images are resized to at most 1600 px and stored inside the page, so nothing is hosted elsewhere.</p>
        </section>

        <section id="commands" className="help-section">
          <h2>Slash commands</h2>
          <p>
            Type <kbd>/</kbd> at the start of a line or after a space. Keep typing to filter (for example{' '}
            <kbd>/todo</kbd>), use <kbd>↑</kbd> <kbd>↓</kbd> to move, and <kbd>Enter</kbd> to insert.{' '}
            <kbd>Esc</kbd> closes the menu.
          </p>
          <div className="help-commands">
            {SLASH_COMMANDS.map((cmd) => (
              <div key={cmd.type} className="help-command">
                <span className="slash-icon">{cmd.iconName ? <Icon name={cmd.iconName} size={20} /> : cmd.icon}</span>
                <span className="slash-text">
                  <span className="slash-title">{cmd.label}</span>
                  <span className="slash-desc">{cmd.description}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="help-note">On an empty line the command changes that line. On a line with text, the new block goes underneath.</p>
        </section>

        <section id="markdown" className="help-section">
          <h2>Markdown shortcuts</h2>
          <p>At the start of a plain text line, type these followed by <kbd>Space</kbd>:</p>
          <KeyTable rows={BLOCK_SHORTCUTS} />
          <p>These convert as soon as you finish typing them, also at the start of a line:</p>
          <KeyTable rows={INSTANT_SHORTCUTS} />
          <p>Anywhere in a line, wrap text to format it:</p>
          <KeyTable rows={INLINE_SHORTCUTS} />
        </section>

        <section id="editing" className="help-section">
          <h2>Editing blocks</h2>
          <ul>
            <li><b>Shift + Enter</b> adds a line break without starting a new block.</li>
            <li><b>Backspace</b> at the start of a heading, list or quote turns it back into plain text.</li>
            <li><b>Enter</b> on an empty list item ends the list.</li>
            <li><b>Tab</b> / <b>Shift + Tab</b> nest list items and to-dos, up to three levels.</li>
            <li><b>To-dos:</b> click the checkbox, or press <kbd>{M} Enter</kbd>.</li>
            <li>
              <b>Code blocks:</b> <kbd>Enter</kbd> adds a new line and <kbd>Tab</kbd> indents. Press{' '}
              <kbd>{M} Enter</kbd> to leave the block. Hover to use <b>Copy</b>.
            </li>
            <li><b>Callouts:</b> click the emoji to cycle through others.</li>
            <li><b>Images:</b> insert with <kbd>/image</kbd> or paste one from your clipboard. Hover to <b>Replace</b> or <b>Delete</b>.</li>
            <li>Click the empty space below the last block to keep writing at the end.</li>
            <li>Undo and redo with <kbd>{M} Z</kbd> and <kbd>{M} Shift Z</kbd>.</li>
          </ul>
        </section>

        <section id="formatting" className="help-section">
          <h2>Text formatting</h2>
          <p>
            Select text to show the formatting bar with <b>bold</b>, <em>italic</em>, <u>underline</u>,{' '}
            <s>strikethrough</s> and <code className="inline-code">code</code>, or use the keyboard:
          </p>
          <KeyTable rows={SHORTCUT_GROUPS[0].rows} />
        </section>

        <section id="files" className="help-section">
          <h2>Files</h2>
          <p>
            Use the <b>File</b> menu in the top bar to work with files on your computer. A page opened from a file stays
            linked to it: the file name shows next to the page title, with <b>●</b> while it has unsaved changes.
          </p>
          <ul>
            <li>
              <b>Open File…</b> (<kbd>{M} O</kbd>): open a <code>.note</code>, Markdown (<code>.md</code>), text or{' '}
              <code>.json</code> file. It appears as a page in the sidebar.
            </li>
            <li>
              <b>Open from URL…</b>: paste a web address. Web pages, Markdown and text files open as a new page.
            </li>
            <li>
              <b>Open Recent:</b> your last 10 files and links, kept between sessions.
            </li>
            <li>
              <b>Save</b> (<kbd>{M} S</kbd>): saves everything now, including linked files.
            </li>
            <li>
              <b>Save As…</b> (<kbd>{M} Shift S</kbd>): save the page to a new file. <b>Note (.note)</b> keeps
              everything; <b>Markdown (.md)</b> is plain text other apps can read (without the icon and cover).
            </li>
            <li>
              <b>Rename…</b> (<kbd>F2</kbd>): change the page title and, optionally, the file name on disk.
            </li>
            <li>
              <b>Print…</b> (<kbd>{M} P</kbd>): print with your system printer, or save as PDF. Only the page itself is
              printed.
            </li>
            <li>
              <b>Quit</b> (<kbd>{M} Q</kbd>): close the app. If something isn’t saved you’re asked first, unless you
              ticked <b>Don’t show this again</b>.
            </li>
          </ul>
          <p className="help-note">
            Closing the window with its <b>×</b> button shows the browser’s own “Leave site?” warning when there are
            unsaved changes. Browsers don’t allow a custom dialog there, so use <b>Quit</b> for the Save / Don’t Save
            choice.
          </p>
        </section>

        <section id="saving" className="help-section">
          <h2>Saving</h2>
          <p>
            Changes save automatically a moment after you stop typing. The top bar shows <b>Saving...</b> and then{' '}
            <b>Saved just now</b>. Press <kbd>{M} S</kbd> to save immediately. With autosave turned off in Preferences,
            the top bar shows <b>Unsaved changes</b> until you save.
          </p>
          <p className="help-note">
            By default, notes are stored in this browser only: they won’t appear on another device, and clearing the
            browser’s site data deletes them. If browser storage fills up (mostly from large images), the status
            changes to <b>Not saved</b>. To avoid both, choose a folder in <b>Preferences → Storage</b>.
          </p>
        </section>

        <section id="preferences" className="help-section">
          <h2>Preferences</h2>
          <p>
            Open <b>Preferences</b> from the sidebar (under Help), from <b>File → Preferences…</b>, or with{' '}
            <kbd>{M} ,</kbd>.
          </p>
          <ul>
            <li>
              <b>Storage:</b> keep your pages in this browser, or in a folder you choose (for example{' '}
              <code>C:\Users\you\Documents\Notes</code>). The folder holds a single file,{' '}
              <code>notes-workspace.json</code>, has no size limit, and is easy to back up or sync.
            </li>
            <li>
              <b>Autosave</b> on or off, and the <b>autosave delay</b> in milliseconds: how long to wait after you stop
              typing before saving.
            </li>
            <li>
              <b>Ask to save unsaved changes when closing:</b> turns the close warning back on after you chose “Don’t
              show this again”.
            </li>
            <li>
              <b>Show line numbers</b> in the left margin, one number per block.
            </li>
            <li>
              <b>Show word count:</b> words, characters and paragraphs in a bar at the bottom of the page.
            </li>
          </ul>
        </section>

        <section id="sharing" className="help-section">
          <h2>Sharing</h2>
          <ol className="help-steps">
            <li>Click <b>Share</b> in the top bar.</li>
            <li>Click <b>Copy link</b> and send it to anyone.</li>
          </ol>
          <p>
            The link opens a <b>read-only</b> copy of the page. Viewers can click <b>Duplicate to my notes</b> to get an
            editable copy in their own browser.
          </p>
          <p className="help-note">
            The page is stored inside the link itself, so the link is a snapshot: after editing, open Share again to
            get an updated link. Pages with uploaded images make long links, which some chat apps may cut off.
          </p>
        </section>

        <section id="shortcuts" className="help-section">
          <h2>Keyboard shortcuts</h2>
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="help-shortcut-group">
              <h3>{group.title}</h3>
              <KeyTable rows={group.rows} />
            </div>
          ))}
          <p className="help-note">
            Use <kbd>{M} Shift L</kbd> or the <Icon name="moon" size={14} className="inline-icon" /> button to switch
            between light and dark mode.
          </p>
        </section>
      </div>
    </article>
  );
}
