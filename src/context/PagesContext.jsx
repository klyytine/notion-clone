import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePrefs } from './PrefsContext';
import {
  WORKSPACE_FILE,
  loadLocalPages,
  makePage,
  parseWorkspace,
  saveLocalPages,
  serializeWorkspace,
} from '../files/workspace';
import { baseName, fileApi, joinPath, samePath } from '../files/fileApi';
import { serializePage } from '../files/documents';
import { t } from '../i18n';

export { makePage, newId } from '../files/workspace';

// Keepalive requests are capped by browsers at ~64 KB.
const KEEPALIVE_LIMIT = 60000;

const PagesContext = createContext(null);

function describeSaveError(err) {
  if (err?.name === 'QuotaExceededError') return t('saveStatus.storageFull');
  return t('saveStatus.failed', { message: err?.message || t('saveStatus.unknownError') });
}

export function PagesProvider({ children }) {
  const { prefs, updatePrefs } = usePrefs();
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const folder = prefs.storageFolder;

  const [pages, setPages] = useState(() => (folder ? null : loadLocalPages()));
  const [loadError, setLoadError] = useState(null);
  const [saveState, setSaveState] = useState({ status: 'idle', at: null, message: '' });
  const [unsavedFiles, setUnsavedFiles] = useState(() => new Set());

  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const dirtyRef = useRef(false); // workspace has changes not yet stored
  const dirtyFilesRef = useRef(new Set()); // pages whose linked file needs writing
  const timerRef = useRef(null);
  const chainRef = useRef(Promise.resolve(true));
  const quittingRef = useRef(false);
  const loadedFromRef = useRef(folder ? null : 'browser');

  const resetDirty = () => {
    clearTimeout(timerRef.current);
    dirtyRef.current = false;
    dirtyFilesRef.current = new Set();
    setUnsavedFiles(new Set());
    setSaveState({ status: 'idle', at: null, message: '' });
  };

  const load = useCallback(async () => {
    const source = prefsRef.current.storageFolder;
    resetDirty();
    setLoadError(null);
    if (!source) {
      setPages(loadLocalPages());
      loadedFromRef.current = 'browser';
      return;
    }
    // Keep showing the current pages (if any) until the folder's pages arrive.
    loadedFromRef.current = source;
    try {
      const { content } = await fileApi.read(joinPath(source, WORKSPACE_FILE));
      setPages(parseWorkspace(content));
    } catch (err) {
      setLoadError(err.status === 404 ? t('storageScreen.noWorkspaceFile', { file: WORKSPACE_FILE }) : err.message);
    }
  }, []);

  useEffect(() => {
    if (loadedFromRef.current !== (folder || 'browser')) load();
  }, [folder, load]);

  const writeWorkspace = async (list) => {
    const target = prefsRef.current.storageFolder;
    if (target) await fileApi.write(joinPath(target, WORKSPACE_FILE), serializeWorkspace(list), { overwrite: true });
    else saveLocalPages(list);
  };

  /** Stores the workspace and every changed linked file. Resolves to true on success. */
  const flush = useCallback(() => {
    clearTimeout(timerRef.current);
    const run = async () => {
      const list = pagesRef.current;
      const workspaceDirty = dirtyRef.current;
      const fileIds = [...dirtyFilesRef.current];
      if (!list || (!workspaceDirty && fileIds.length === 0)) return true;

      dirtyRef.current = false;
      dirtyFilesRef.current = new Set();
      setSaveState((s) => ({ ...s, status: 'saving', message: '' }));

      let error = null;
      if (workspaceDirty) {
        try {
          await writeWorkspace(list);
        } catch (err) {
          dirtyRef.current = true;
          error = describeSaveError(err);
        }
      }
      for (const id of fileIds) {
        const page = list.find((p) => p.id === id);
        if (!page?.filePath) continue;
        try {
          await fileApi.write(page.filePath, serializePage(page, page.fileFormat || 'note'), { overwrite: true });
        } catch (err) {
          dirtyFilesRef.current.add(id);
          error ??= t('saveStatus.fileFailed', { name: baseName(page.filePath), message: err.message });
        }
      }

      setUnsavedFiles(new Set(dirtyFilesRef.current));
      if (error) {
        setSaveState({ status: 'error', at: Date.now(), message: error });
        return false;
      }
      const stillDirty = dirtyRef.current || dirtyFilesRef.current.size > 0;
      const pendingStatus = prefsRef.current.autosave ? 'saving' : 'dirty';
      setSaveState({ status: stillDirty ? pendingStatus : 'saved', at: Date.now(), message: '' });
      return true;
    };
    chainRef.current = chainRef.current.then(run).catch(() => false);
    return chainRef.current;
  }, []);

  // Autosave: write a moment after the last change.
  useEffect(() => {
    const dirty = dirtyRef.current || dirtyFilesRef.current.size > 0;
    if (!dirty) return undefined;
    if (!prefs.autosave) {
      setSaveState((s) => (s.status === 'saving' ? { ...s, status: 'dirty' } : s));
      return undefined;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, prefs.autosaveDelay);
    return () => clearTimeout(timerRef.current);
  }, [pages, prefs.autosave, prefs.autosaveDelay, flush]);

  // Last chance to save, and the "unsaved changes" prompt, when the window closes.
  useEffect(() => {
    const saveOnExit = () => {
      const { autosave, storageFolder } = prefsRef.current;
      const list = pagesRef.current;
      // After “Don’t Save” the pending changes are intentionally dropped.
      if (quittingRef.current === 'discard' || !autosave || !dirtyRef.current || !list) return;
      if (!storageFolder) {
        try {
          saveLocalPages(list);
          dirtyRef.current = false;
        } catch {
          /* quota: nothing more we can do */
        }
        return;
      }
      const body = JSON.stringify({ path: joinPath(storageFolder, WORKSPACE_FILE), content: serializeWorkspace(list), overwrite: true });
      if (body.length < KEEPALIVE_LIMIT) {
        fetch('/api/fs/write', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'X-Notes-App': '1' }, body }).catch(() => {});
        dirtyRef.current = false;
      }
    };
    const onBeforeUnload = (event) => {
      saveOnExit();
      if (quittingRef.current || !prefsRef.current.confirmOnClose) return;
      if (dirtyRef.current || dirtyFilesRef.current.size > 0) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', saveOnExit);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', saveOnExit);
    };
  }, []);

  const markFileDirty = (id) => {
    const page = pagesRef.current?.find((p) => p.id === id);
    if (!page?.filePath) return;
    dirtyFilesRef.current.add(id);
    setUnsavedFiles((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  const clearFileDirty = (id) => {
    dirtyFilesRef.current.delete(id);
    setUnsavedFiles((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const mutate = useCallback((updater) => {
    dirtyRef.current = true;
    const status = prefsRef.current.autosave ? 'saving' : 'dirty';
    setSaveState((s) => (s.status === status ? s : { ...s, status, message: '' }));
    setPages(updater);
  }, []);

  const createPage = useCallback(
    (fields) => {
      const page = makePage(fields);
      mutate((prev) => [...prev, page]);
      return page;
    },
    [mutate],
  );

  const updatePage = useCallback(
    (id, patch) => {
      markFileDirty(id);
      mutate((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)));
    },
    [mutate],
  );

  /** Points a page at a file on disk (after Save As / Rename) without marking it as changed. */
  const linkPageToFile = useCallback(
    (id, filePath, fileFormat) => {
      clearFileDirty(id);
      mutate((prev) => prev.map((p) => (p.id === id ? { ...p, filePath, fileFormat } : p)));
    },
    [mutate],
  );

  const deletePage = useCallback(
    (id) => {
      clearFileDirty(id);
      mutate((prev) => prev.filter((p) => p.id !== id));
    },
    [mutate],
  );

  /** Adds an opened document as a page, or returns the page that already has this file open. */
  const openDocument = useCallback(
    (doc, { filePath = null, fileFormat = null } = {}) => {
      const existing = filePath && pagesRef.current.find((p) => p.filePath && samePath(p.filePath, filePath));
      if (existing) return existing;
      return createPage({
        title: doc.title || '',
        icon: doc.icon || null,
        cover: doc.cover || null,
        content: doc.content,
        filePath,
        fileFormat,
      });
    },
    [createPage],
  );

  const hasUnsavedChanges = useCallback(() => dirtyRef.current || dirtyFilesRef.current.size > 0, []);
  const setQuitting = useCallback((value) => {
    quittingRef.current = value;
  }, []);

  const value = useMemo(
    () => ({
      pages,
      createPage,
      updatePage,
      deletePage,
      linkPageToFile,
      openDocument,
      saveState,
      unsavedFiles,
      flush,
      hasUnsavedChanges,
      setQuitting,
      reload: load,
    }),
    [pages, createPage, updatePage, deletePage, linkPageToFile, openDocument, saveState, unsavedFiles, flush, hasUnsavedChanges, setQuitting, load],
  );

  if (loadError) {
    return (
      <div className="storage-screen">
        <h1>{t('storageScreen.cantOpenTitle')}</h1>
        <p className="storage-path">{folder}</p>
        <p>{loadError}</p>
        <div className="storage-actions">
          <button type="button" className="btn btn-primary" onClick={load}>{t('storageScreen.tryAgain')}</button>
          <button type="button" className="btn" onClick={() => updatePrefs({ storageFolder: null })}>
            {t('storageScreen.useBrowser')}
          </button>
        </div>
      </div>
    );
  }
  if (!pages) {
    return (
      <div className="storage-screen">
        <p className="storage-loading">{t('storageScreen.loading', { folder })}</p>
      </div>
    );
  }

  return <PagesContext.Provider value={value}>{children}</PagesContext.Provider>;
}

export function usePages() {
  const ctx = useContext(PagesContext);
  if (!ctx) throw new Error('usePages must be used inside <PagesProvider>');
  return ctx;
}
