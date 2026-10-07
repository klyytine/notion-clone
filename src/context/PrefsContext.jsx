import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'notion-clone:prefs:v1';
export const AUTOSAVE_MIN_MS = 100;
export const AUTOSAVE_MAX_MS = 60000;

export const DEFAULT_PREFS = {
  autosave: true,
  autosaveDelay: 600,
  confirmOnClose: true,
  showLineNumbers: false,
  showWordCount: false,
  storageFolder: null, // null = this browser's local storage
};

export function clampDelay(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_PREFS.autosaveDelay;
  return Math.min(AUTOSAVE_MAX_MS, Math.max(AUTOSAVE_MIN_MS, n));
}

function sanitize(raw) {
  const p = { ...DEFAULT_PREFS, ...(raw && typeof raw === 'object' ? raw : {}) };
  return {
    autosave: p.autosave !== false,
    autosaveDelay: clampDelay(p.autosaveDelay),
    confirmOnClose: p.confirmOnClose !== false,
    showLineNumbers: p.showLineNumbers === true,
    showWordCount: p.showWordCount === true,
    storageFolder: typeof p.storageFolder === 'string' && p.storageFolder.trim() ? p.storageFolder.trim() : null,
  };
}

function load() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return DEFAULT_PREFS;
  }
}

const PrefsContext = createContext(null);

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  const updatePrefs = useCallback((patch) => setPrefs((p) => sanitize({ ...p, ...patch })), []);
  const value = useMemo(() => ({ prefs, updatePrefs }), [prefs, updatePrefs]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside <PrefsProvider>');
  return ctx;
}
