# Notes — a Notion-style block editor

React 18 + Vite + Slate.js. Pages are kept in `localStorage` by default, or in a workspace file in a folder you choose. Images are stored as base64 data URLs. A small local file service built into the Vite server lets the app open and save real files on disk.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/ (runs without the file service)
```

## Open it like a desktop app (Windows)

- **Double-click `run.bat`**, or
- Run **`create-shortcut.bat`** once to put a **Notes** icon on the Desktop and in the Start menu, then click that.

The launcher (`launcher/launch.ps1`) starts the server hidden, opens the app in its own Edge/Chrome window (no tabs or address bar), and stops the server when you close the window. On first run it installs dependencies if needed. Requires Node.js.

Notes opened this way are stored in the app window's own browser profile (`%LOCALAPPDATA%\NotesApp\window-profile`), separate from your normal browser. To keep them somewhere you can see and back up, choose a folder in **File → Preferences → Storage**.

## Features

- **Block editor**: text, H1–H3, bulleted/numbered lists (nestable with Tab), to-dos, quote, callout, code, divider, image
- **Slash menu**: type `/` and filter, then ↑ ↓ Enter
- **Markdown shortcuts**: `#`, `##`, `###`, `-`, `1.`, `[]`, `"`, ` ``` `, `---`, plus inline `**bold**`, `*italic*`, `` `code` ``, `~strike~`
- **Hover toolbar**: select text to bold, italicize, underline, strike or code it
- **Page header**: inline title, emoji icon picker (30 emojis, 8 columns), cover image via file upload or URL, hover-revealed "Change / Remove cover"
- **Sidebar**: page list with icons, active highlight, "+ New Page", delete with confirmation, Shortcuts and Help buttons
- **File menu**: Open File, Open from URL, Open Recent, Save, Save As, Rename, Print, Preferences, Quit
- **File formats**: `.note` (lossless JSON) and `.md` open and save; `.txt`, `.json` and web pages open. A page saved to a file stays linked to it, and later saves write back to that file. The top bar shows the file name, with ● when it has unsaved changes.
- **Preferences**: storage location (this browser, or a folder on this computer), autosave on/off and delay, "ask to save" on close, line numbers, word count
- **Autosave**: debounced, with "Saving..." / "Saved just now"; Ctrl/⌘+S saves immediately
- **Public sharing**: `/share#<base64url>`. The page snapshot lives in the URL fragment, so nothing is uploaded. Viewers can duplicate it into their own notes.
- **Help page** (`/help`, in the sidebar): basic usage, every slash command, markdown and keyboard shortcuts
- **Print**: a print stylesheet hides the app chrome and always prints in light colors
- **Dark/light mode**: follows the OS setting by default; toggle with Ctrl/⌘+Shift+L

## Keyboard shortcuts

| Shortcut                                 | Action                                                 |
| ---------------------------------------- | ------------------------------------------------------ |
| Ctrl/⌘ B · I · U · E                     | Bold · italic · underline · inline code                |
| Ctrl/⌘ Shift X                           | Strikethrough                                          |
| Ctrl Shift 0–8 (or Ctrl Alt; ⌘ ⌥ on Mac) | Text, H1, H2, H3, to-do, bullet, numbered, quote, code |
| Tab / Shift Tab                          | Indent / outdent list item                             |
| Ctrl/⌘ Enter                             | Toggle to-do · leave a code block                      |
| Shift Enter                              | Line break inside a block                              |
| Ctrl/⌘ Z / Ctrl/⌘ Shift Z                | Undo / redo                                            |
| Ctrl/⌘ \\                                | Toggle sidebar                                         |
| Ctrl/⌘ Alt N                             | New page                                               |
| Ctrl/⌘ Shift L                           | Toggle dark mode                                       |
| Ctrl/⌘ O                                 | Open file                                              |
| Ctrl/⌘ S / Ctrl/⌘ Shift S                | Save / Save as                                         |
| F2                                       | Rename page                                            |
| Ctrl/⌘ P                                 | Print                                                  |
| Ctrl/⌘ ,                                 | Preferences                                            |
| Ctrl/⌘ Q                                 | Quit                                                   |

## Components

**App shell and state**
- `main.jsx`: mounts the React app.
- `App.jsx`: providers (theme, preferences, pages) and routes: `/p/:id`, `/share`, `/help`.
- `PagesContext`: the list of pages, create/update/delete, autosave queue, writing pages back to linked files, save on window close, unsaved-changes tracking.
- `PrefsContext`: user preferences, validated and stored in `localStorage`.
- `ThemeContext`: light/dark theme, the OS default and the Ctrl/⌘+Shift+L shortcut.
- `welcomePage.js`: the page a new user starts with.

**Screens**
- `Workspace`: the main screen for one page (sidebar, top bar, header, editor, status bar).
- `SharedPage`: read-only view of a shared link, with "Duplicate to my notes".
- `HelpPage`: usage guide, slash commands and shortcuts.

**Layout and chrome**
- `Topbar`: sidebar toggle, File menu, breadcrumb with file chip, save status, Share popover, theme toggle.
- `FileMenu`: the File dropdown with keyboard navigation and the Open Recent submenu.
- `Sidebar`: page list, "+ New Page", delete with confirmation, Shortcuts and Help buttons.
- `StatusBar`: word, character and paragraph count (when turned on in Preferences).
- `ThemeToggle`: light/dark button.

**Page header**
- `PageHeader`: title, icon and cover, and the hover-revealed "Add icon / Add cover" actions.
- `IconPicker`: the 30-emoji grid.
- `ImageSourcePicker`: upload a file or paste a URL; used for covers and image blocks.

**Editor**
- `BlockEditor`: the Slate editor, keyboard shortcuts, slash menu and toolbar wiring.
- `withNotion`: Slate plugin for markdown shortcuts, void blocks, list behavior and normalizing.
- `schema.js`: block types, marks and the sanitizer for untrusted content.
- `commands.js`: toggle marks, change block type, indent and outdent.
- `Element` / `Leaf`: render blocks and inline marks.
- `SlashMenu` / `slashCommands.js`: the `/` menu and its command list.
- `HoverToolbar`: floating formatting toolbar for selected text.

**Files**
- `FileActions`: everything the File menu does, its shortcuts and the dialogs it opens.
- `documents.js`: converts pages to and from `.note`, Markdown, plain text and HTML; word count.
- `fileApi.js` (client): calls the local file service and holds path helpers.
- `workspace.js`: loads and saves the page list (browser or `notes-workspace.json`).
- `recent.js`: the Open Recent list.

**Dialogs and controls**
- `Modal`: shared modal with focus trapping and Esc handling (only the top modal closes).
- `FileDialog`: in-app file browser for Open, Save As and choosing a folder.
- `PreferencesDialog`: Storage, Saving and Editor settings.
- `AppDialogs`: Open from URL, Rename, Unsaved changes, and message dialogs.
- `ConfirmDialog`: yes/no confirmation (deleting a page).
- `ShortcutsDialog`: lists every shortcut from `help/shortcuts.js`.
- `Switch`: labelled on/off toggle.
- `Icon`: inline SVG line icons.

**Helpers**
- `useClickOutside`: closes popovers on outside click or Esc.
- `utils/image.js`: reads image files to data URLs, downscales them, checks image URLs are safe.
- `utils/share.js`: base64url encoding and decoding for share links.
- `utils/platform.js`: Mac detection and ⌘/Ctrl labels.

**Server and launcher**
- `server/fileApi.js`: Vite plugin that adds the `/api/*` file service to the dev and preview servers.
- `launcher/launch.ps1`: starts the server and opens the app window.
- `launcher/create-shortcut.ps1`: creates the Desktop and Start menu shortcuts.
- `launcher/make_icon.py`: draws the app icon (needs Pillow).

## Files and folders

```
notion-clone/
├── index.html                  Vite entry page
├── package.json                Scripts and dependencies
├── vite.config.js              React plugin + local file service plugin
├── run.bat                     Opens the app in its own window
├── create-shortcut.bat         Adds Desktop and Start menu shortcuts
├── PROMPT.md                   Stand-alone build prompt for this app
├── README.md
├── public/
│   └── icon.png                App and favicon icon
├── launcher/
│   ├── launch.ps1              Starts server, opens app window, cleans up
│   ├── create-shortcut.ps1     Creates Notes.lnk shortcuts
│   ├── make_icon.py            Generates notes.ico and public/icon.png
│   └── notes.ico               Shortcut icon
├── server/
│   └── fileApi.js              Local file service (/api/*)
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles.css              All styles: themes, dark mode, print
│   ├── context/
│   │   ├── PagesContext.jsx
│   │   ├── PrefsContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── welcomePage.js
│   ├── pages/
│   │   ├── Workspace.jsx
│   │   ├── SharedPage.jsx
│   │   └── HelpPage.jsx
│   ├── components/
│   │   ├── Topbar.jsx
│   │   ├── FileMenu.jsx
│   │   ├── FileDialog.jsx
│   │   ├── PreferencesDialog.jsx
│   │   ├── AppDialogs.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── Modal.jsx
│   │   ├── Sidebar.jsx
│   │   ├── PageHeader.jsx
│   │   ├── IconPicker.jsx
│   │   ├── ImageSourcePicker.jsx
│   │   ├── ShortcutsDialog.jsx
│   │   ├── StatusBar.jsx
│   │   ├── Switch.jsx
│   │   ├── ThemeToggle.jsx
│   │   └── Icon.jsx
│   ├── editor/
│   │   ├── BlockEditor.jsx
│   │   ├── withNotion.js
│   │   ├── schema.js
│   │   ├── commands.js
│   │   ├── Element.jsx
│   │   ├── Leaf.jsx
│   │   ├── SlashMenu.jsx
│   │   ├── slashCommands.js
│   │   └── HoverToolbar.jsx
│   ├── files/
│   │   ├── FileActions.jsx
│   │   ├── documents.js
│   │   ├── fileApi.js
│   │   ├── workspace.js
│   │   └── recent.js
│   ├── help/
│   │   └── shortcuts.js        Single source for shortcut lists
│   ├── hooks/
│   │   └── useClickOutside.js
│   └── utils/
│       ├── image.js
│       ├── share.js
│       └── platform.js
├── dist/                       Build output (git-ignored)
├── node_modules/               Dependencies (git-ignored)
└── .firecrawl/                 Notion reference pages used while building (git-ignored)
```

## Files read and written at runtime

**Browser storage (`localStorage`)**

| Key | Read | Written | Why |
| --- | --- | --- | --- |
| `notion-clone:pages:v1` | At startup, when storage is "This browser" | On autosave/save, on window close, and when switching storage back to the browser | All pages (title, icon, cover, blocks, linked file path) |
| `notion-clone:prefs:v1` | At startup | When a preference changes | Preferences, including the chosen storage folder |
| `notion-clone:theme` | At startup | When the theme is toggled | Remembers light/dark choice |
| `notion-clone:recent:v1` | At startup, and when another tab changes it | When a file or URL is opened or saved, renamed, or Clear Recent is used | The Open Recent list (last 10) |

In the launcher window, this storage belongs to the profile in `%LOCALAPPDATA%\NotesApp\window-profile`. In a normal browser tab, it belongs to that browser for `http://localhost:5173`.

**Files on disk (through the local file service)**

| File | Read | Written | Why |
| --- | --- | --- | --- |
| `<storage folder>\notes-workspace.json` | At startup and when the folder is chosen | On autosave/save, on window close, and when the folder is set up | All pages, when storage is "A folder on this computer" |
| Any `.note` / `.md` file you save to | When opened (File → Open, Open Recent) | Save As, then every save while the page is linked to it | The page as a standalone file |
| Any `.txt` / `.json` / `.md` / `.note` file you open | File → Open, Open Recent | Never (`.txt` and `.json` open as new pages) | Importing content |
| Folders shown in the file dialog | When browsing | Only Preferences creates the storage folder if it doesn't exist | Picking files and folders |
| Renamed file | – | File → Rename with "Also rename the file on disk" | Keeps file name in step with the title |
| `%LOCALAPPDATA%\NotesApp\window.pid` | `app/quit` reads it | `launch.ps1` writes it when it opens the window, deletes it when the window closes | Lets File → Quit close the app window |

**Network**
- File → Open from URL fetches the page through the file service (`fetch-url`) so other sites' CORS rules don't block it. Without the service, the browser fetches it directly. Nothing is sent anywhere else.
- Share links carry the page in the URL fragment (`#…`), which browsers never send to a server.

**Launcher and setup (not at app runtime)**
- `launch.ps1` runs `npm install` into `node_modules/` on first run and creates the browser profile folder.
- `create-shortcut.ps1` writes `Notes.lnk` to the Desktop and the Start menu Programs folder.
- `make_icon.py` writes `launcher/notes.ico` and `public/icon.png`.
- `npm run build` writes `dist/`.

## Notes

- Uploaded images are downscaled to at most 1600px (WebP) to stay within the ~5 MB `localStorage` quota. If storage fills up, the indicator shows "Not saved". A folder workspace has no such limit.
- Shared links that contain uploaded images can be long. The share popover warns when a link is over 8 KB.
- Data loaded from storage, files, URLs or a shared link is sanitized: only known block types and marks are kept, and image URLs must be `http(s)` or `data:image/…`.
- The file service only answers same-origin requests from `localhost` with the `X-Notes-App` header, so other websites can't use it to touch your files.
- Without the file service (e.g. a static deployment of `dist/`), storage stays in the browser, Open uses the browser's file picker, and Save As downloads a `.note` file.
- When deploying, configure the host to serve `index.html` for every route (SPA fallback) so `/p/:id`, `/share` and `/help` resolve.
