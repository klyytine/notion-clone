import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePages } from '../context/PagesContext';
import { usePrefs } from '../context/PrefsContext';
import { baseName, dirName, extName, fileApi, joinPath, safeFileName, samePath, useFileService } from './fileApi';
import { SAVE_FORMATS, detectFormat, formatFromPath, parseDocument, serializePage } from './documents';
import { addRecent, removeRecent, renameRecent } from './recent';
import FileDialog from '../components/FileDialog';
import PreferencesDialog from '../components/PreferencesDialog';
import { MessageDialog, OpenUrlDialog, RenameDialog, UnsavedChangesDialog } from '../components/AppDialogs';

const FileActionsContext = createContext(null);
const OPEN_ACCEPT = '.note,.json,.md,.markdown,.txt,text/plain,text/markdown,application/json';

function nameFromUrl(url) {
  try {
    const { pathname, hostname } = new URL(url);
    return decodeURIComponent(pathname.split('/').filter(Boolean).pop() || hostname);
  } catch {
    return url;
  }
}

/**
 * File menu actions (open, save, rename, print, preferences, quit), their
 * keyboard shortcuts, and the dialogs they show.
 */
export function FileActionsProvider({ page, children }) {
  const navigate = useNavigate();
  const { openDocument, flush, linkPageToFile, updatePage, hasUnsavedChanges, setQuitting } = usePages();
  const { prefs, updatePrefs } = usePrefs();
  const service = useFileService();
  const [dialog, setDialog] = useState(null);
  const nativeInputRef = useRef(null);

  const showMessage = (title, message) => setDialog({ type: 'message', title, message });
  const close = () => setDialog(null);

  function openParsed(doc, { filePath = null, fileFormat = null, recent = null }) {
    const opened = openDocument(doc, { filePath, fileFormat });
    if (recent) addRecent({ ...recent, title: opened.title || doc.title });
    navigate(`/p/${opened.id}`);
  }

  async function openPath(path) {
    const format = formatFromPath(path);
    if (!format || format === 'html') throw new Error('This file type isn’t supported. Open a .note, .md, .txt or .json file.');
    const { content, path: resolved } = await fileApi.read(path);
    const doc = parseDocument(content, { format, name: baseName(resolved) });
    // .note/.json and Markdown can be saved back in place; .txt opens as a copy.
    const fileFormat = format === 'md' ? 'md' : format === 'note' ? 'note' : null;
    openParsed(doc, { filePath: fileFormat ? resolved : null, fileFormat, recent: { kind: 'file', location: resolved } });
  }

  async function openUrl(url) {
    let result;
    if (service) {
      result = await fileApi.fetchUrl(url);
    } else {
      const response = await fetch(url).catch(() => {
        throw new Error('The site can’t be reached from here (it may block access from other sites).');
      });
      if (!response.ok) throw new Error(`The site answered with ${response.status}.`);
      result = { url: response.url, contentType: response.headers.get('content-type') || '', content: await response.text() };
    }
    const format = detectFormat({ url: result.url, contentType: result.contentType, text: result.content });
    const doc = parseDocument(result.content, { format, name: nameFromUrl(result.url), baseUrl: result.url });
    openParsed(doc, { recent: { kind: 'url', location: url } });
  }

  async function readNativeFile(file) {
    const format = formatFromPath(file.name) || 'txt';
    const doc = parseDocument(await file.text(), { format: format === 'html' ? 'html' : format, name: file.name });
    openParsed(doc, {});
  }

  async function writeDocument(target, path, format) {
    await fileApi.write(path, serializePage(target, format), { overwrite: true });
    linkPageToFile(target.id, path, format);
    addRecent({ kind: 'file', location: path, title: target.title });
    await flush();
  }

  function downloadDocument(target) {
    const blob = new Blob([serializePage(target, 'note')], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${safeFileName(target.title)}.note`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function quitNow({ discard = false } = {}) {
    setQuitting(discard ? 'discard' : true);
    window.close();
    // Windows that weren't opened by a script can't close themselves; ask the launcher.
    await new Promise((resolve) => setTimeout(resolve, 250));
    let closed = false;
    try {
      closed = (await fileApi.quit()).ok;
    } catch {
      closed = false;
    }
    if (!closed) {
      setQuitting(false);
      showMessage('Ready to close', 'Your work is handled. Close this window to finish quitting.');
    }
  }

  const actions = {
    openFile() {
      if (service) {
        const start = page?.filePath ? dirName(page.filePath) : prefs.storageFolder || service.places.find((p) => p.label.startsWith('Documents'))?.path;
        setDialog({ type: 'open', startDir: start });
      } else {
        nativeInputRef.current?.click();
      }
    },
    openUrl() {
      setDialog({ type: 'url' });
    },
    async openRecent(entry) {
      try {
        if (entry.kind === 'url') {
          await openUrl(entry.location);
          return;
        }
        if (!service) throw new Error('Recent files need the app’s file service. Start the app with run.bat.');
        await openPath(entry.location);
      } catch (err) {
        if (err.status === 404) {
          removeRecent(entry.kind, entry.location);
          showMessage('File not found', `“${entry.location}” isn’t there anymore, so it was removed from Open Recent.`);
        } else {
          showMessage('Couldn’t open', err.message);
        }
      }
    },
    async save() {
      const ok = await flush();
      if (!ok) showMessage('Couldn’t save', 'Some changes couldn’t be saved. The status in the top bar has the details.');
    },
    saveAs() {
      if (!page) return;
      if (!service) {
        downloadDocument(page);
        return;
      }
      const format = page.fileFormat || 'note';
      setDialog({
        type: 'saveAs',
        startDir: page.filePath ? dirName(page.filePath) : prefs.storageFolder || service.places.find((p) => p.label.startsWith('Documents'))?.path,
        suggestedName: page.filePath ? baseName(page.filePath) : `${safeFileName(page.title)}${SAVE_FORMATS[format].ext}`,
        format,
      });
    },
    rename() {
      if (page) setDialog({ type: 'rename' });
    },
    print() {
      window.print();
    },
    preferences() {
      setDialog({ type: 'prefs' });
    },
    quit() {
      if (hasUnsavedChanges() && prefs.confirmOnClose) setDialog({ type: 'unsaved' });
      else quitNow();
    },
  };

  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const dialogRef = useRef(dialog);
  dialogRef.current = dialog;

  // Keyboard shortcuts for the File menu.
  useEffect(() => {
    const onKey = (e) => {
      const a = actionsRef.current;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      let action = null;
      if (!mod && !e.altKey && !e.shiftKey && e.key === 'F2') action = a.rename;
      else if (mod && !e.altKey) {
        if (key === 's') action = e.shiftKey ? a.saveAs : a.save;
        else if (!e.shiftKey && key === 'o') action = a.openFile;
        else if (!e.shiftKey && key === 'p') action = a.print;
        else if (!e.shiftKey && e.key === ',') action = a.preferences;
        else if (!e.shiftKey && key === 'q') action = a.quit;
      }
      if (!action) return;
      e.preventDefault();
      // Save still works with a dialog open; everything else waits.
      if (dialogRef.current && action !== a.save) return;
      action();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(
    () => ({
      openFile: () => actionsRef.current.openFile(),
      openUrl: () => actionsRef.current.openUrl(),
      openRecent: (entry) => actionsRef.current.openRecent(entry),
      save: () => actionsRef.current.save(),
      saveAs: () => actionsRef.current.saveAs(),
      rename: () => actionsRef.current.rename(),
      print: () => actionsRef.current.print(),
      preferences: () => actionsRef.current.preferences(),
      quit: () => actionsRef.current.quit(),
    }),
    [],
  );
  const state = useMemo(() => ({ ...value, hasPage: !!page, service }), [value, page, service]);

  return (
    <FileActionsContext.Provider value={state}>
      {children}

      <input
        ref={nativeInputRef}
        type="file"
        accept={OPEN_ACCEPT}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setDialog(null);
          try {
            await readNativeFile(file);
          } catch (err) {
            showMessage('Couldn’t open', err.message);
          }
        }}
      />

      {dialog?.type === 'open' && service && (
        <FileDialog
          mode="open"
          service={service}
          startDir={dialog.startDir}
          onCancel={close}
          onUseSystemDialog={() => nativeInputRef.current?.click()}
          onSubmit={async (path) => {
            close();
            try {
              await openPath(path);
            } catch (err) {
              showMessage('Couldn’t open', err.message);
            }
          }}
        />
      )}

      {dialog?.type === 'saveAs' && service && page && (
        <FileDialog
          mode="save"
          service={service}
          startDir={dialog.startDir}
          suggestedName={dialog.suggestedName}
          initialFormat={dialog.format}
          onCancel={close}
          onSubmit={async ({ path, format }) => {
            close();
            try {
              await writeDocument(page, path, format);
            } catch (err) {
              showMessage('Couldn’t save', err.message);
            }
          }}
        />
      )}

      {dialog?.type === 'url' && (
        <OpenUrlDialog
          onCancel={close}
          onSubmit={async (url) => {
            try {
              await openUrl(url);
              close();
              return null;
            } catch (err) {
              return err.message;
            }
          }}
        />
      )}

      {dialog?.type === 'rename' && page && (
        <RenameDialog
          page={page}
          canRenameFile={!!service}
          onCancel={close}
          onSubmit={async ({ title, renameFile }) => {
            try {
              if (renameFile) {
                const newPath = joinPath(dirName(page.filePath), safeFileName(title) + extName(page.filePath));
                if (!samePath(newPath, page.filePath) || baseName(newPath) !== baseName(page.filePath)) {
                  await fileApi.rename(page.filePath, newPath);
                  renameRecent(page.filePath, newPath, title);
                  linkPageToFile(page.id, newPath, page.fileFormat);
                }
              }
              updatePage(page.id, { title });
              close();
              return null;
            } catch (err) {
              return err.message;
            }
          }}
        />
      )}

      {dialog?.type === 'prefs' && <PreferencesDialog service={service} onClose={close} />}

      {dialog?.type === 'unsaved' && (
        <UnsavedChangesDialog
          onCancel={close}
          onDiscard={(dontAskAgain) => {
            if (dontAskAgain) updatePrefs({ confirmOnClose: false });
            close();
            quitNow({ discard: true });
          }}
          onSave={async (dontAskAgain) => {
            if (dontAskAgain) updatePrefs({ confirmOnClose: false });
            if (await flush()) {
              close();
              quitNow();
            } else {
              showMessage('Couldn’t save', 'Some changes couldn’t be saved, so the app stayed open.');
            }
          }}
        />
      )}

      {dialog?.type === 'message' && <MessageDialog title={dialog.title} message={dialog.message} onClose={close} />}
    </FileActionsContext.Provider>
  );
}

export function useFileActions() {
  const ctx = useContext(FileActionsContext);
  if (!ctx) throw new Error('useFileActions must be used inside <FileActionsProvider>');
  return ctx;
}
