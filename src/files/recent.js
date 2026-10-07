import { useSyncExternalStore } from 'react';
import { samePath } from './fileApi';

// "Open Recent": the last 10 files and links, kept in this app's localStorage
// so the list carries over between sessions.
const KEY = 'notion-clone:recent:v1';
const MAX_ITEMS = 10;
const listeners = new Set();

function load() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(items)
      ? items.filter((r) => r && (r.kind === 'file' || r.kind === 'url') && typeof r.location === 'string').slice(0, MAX_ITEMS)
      : [];
  } catch {
    return [];
  }
}

let items = load();

function commit(next) {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full: keep the in-memory list */
  }
  listeners.forEach((fn) => fn());
}

const matches = (item, kind, location) =>
  item.kind === kind && (kind === 'file' ? samePath(item.location, location) : item.location === location);

export function addRecent({ kind, location, title = '' }) {
  commit([{ kind, location, title, openedAt: Date.now() }, ...items.filter((r) => !matches(r, kind, location))].slice(0, MAX_ITEMS));
}

export function removeRecent(kind, location) {
  commit(items.filter((r) => !matches(r, kind, location)));
}

export function renameRecent(from, to, title) {
  commit(items.map((r) => (matches(r, 'file', from) ? { ...r, location: to, title } : r)));
}

export function clearRecent() {
  commit([]);
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (e) => {
    if (e.key === KEY) {
      items = load();
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useRecent() {
  return useSyncExternalStore(subscribe, () => items);
}
