import { sanitizeContent } from '../editor/schema';
import { isSafeImageUrl } from '../utils/image';
import { createWelcomePage } from '../context/welcomePage';

// The workspace is the list of pages in the sidebar. It lives either in this
// browser's localStorage or in WORKSPACE_FILE inside a folder chosen in Preferences.
export const LOCAL_KEY = 'notion-clone:pages:v1';
export const WORKSPACE_FILE = 'notes-workspace.json';

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function makePage(fields = {}) {
  const now = Date.now();
  return {
    id: newId(),
    title: '',
    icon: null,
    cover: null,
    content: sanitizeContent(null),
    filePath: null,
    fileFormat: null,
    createdAt: now,
    updatedAt: now,
    ...fields,
  };
}

export function normalizePage(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') return null;
  return {
    id: raw.id,
    title: typeof raw.title === 'string' ? raw.title : '',
    icon: typeof raw.icon === 'string' ? raw.icon : null,
    cover: isSafeImageUrl(raw.cover) ? raw.cover : null,
    content: sanitizeContent(raw.content),
    filePath: typeof raw.filePath === 'string' && raw.filePath ? raw.filePath : null,
    fileFormat: raw.fileFormat === 'md' || raw.fileFormat === 'note' ? raw.fileFormat : null,
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

function normalizeList(list) {
  const pages = (Array.isArray(list) ? list : []).map(normalizePage).filter(Boolean);
  return pages;
}

export function loadLocalPages() {
  try {
    const pages = normalizeList(JSON.parse(localStorage.getItem(LOCAL_KEY)));
    if (pages.length) return pages;
  } catch {
    /* corrupted or unavailable storage: start fresh */
  }
  return [createWelcomePage(makePage)];
}

/** Throws (e.g. QuotaExceededError) when the browser refuses to store the data. */
export function saveLocalPages(pages) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(pages));
}

export function serializeWorkspace(pages) {
  return JSON.stringify({ format: 'notes-workspace', version: 1, savedAt: new Date().toISOString(), pages }, null, 2);
}

export function parseWorkspace(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${WORKSPACE_FILE} is damaged and can’t be read.`);
  }
  const pages = normalizeList(Array.isArray(data) ? data : data?.pages);
  return pages.length ? pages : [makePage()];
}
