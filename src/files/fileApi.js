import { useEffect, useState } from 'react';

// Client for the local file service in server/fileApi.js.

async function call(endpoint, body = {}) {
  let response;
  try {
    response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Notes-App': '1' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('The app’s file service isn’t running. Start the app with run.bat or “npm run dev”.');
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw Object.assign(new Error('The app’s file service isn’t available here.'), { status: response.status });
  }
  if (!response.ok) throw Object.assign(new Error(data.error || `Request failed (${response.status})`), { status: response.status });
  return data;
}

export const fileApi = {
  list: (path) => call('fs/list', { path }),
  stat: (path) => call('fs/stat', { path }),
  read: (path) => call('fs/read', { path }),
  write: (path, content, { overwrite = false } = {}) => call('fs/write', { path, content, overwrite }),
  rename: (from, to) => call('fs/rename', { from, to }),
  mkdir: (path) => call('fs/mkdir', { path }),
  fetchUrl: (url) => call('fetch-url', { url }),
  quit: () => call('app/quit'),
};

let servicePromise;
/** Resolves to the service info ({ home, sep, places, … }) or null when unavailable. */
export function getFileService() {
  servicePromise ??= call('fs/ping').catch(() => null);
  return servicePromise;
}

/** undefined while checking, null when unavailable, otherwise the service info. */
export function useFileService() {
  const [service, setService] = useState(undefined);
  useEffect(() => {
    let alive = true;
    getFileService().then((info) => alive && setService(info));
    return () => {
      alive = false;
    };
  }, []);
  return service;
}

const separatorOf = (p) => (p.includes('\\') ? '\\' : '/');

export function joinPath(dir, name) {
  const sep = separatorOf(dir);
  return dir.endsWith(sep) ? dir + name : dir + sep + name;
}

export function baseName(p = '') {
  const parts = p.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || p;
}

export function dirName(p = '') {
  const index = Math.max(p.lastIndexOf('\\'), p.lastIndexOf('/'));
  if (index <= 0) return p;
  const dir = p.slice(0, index);
  return /^[a-z]:$/i.test(dir) ? `${dir}\\` : dir;
}

export function extName(p = '') {
  const name = baseName(p);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot).toLowerCase() : '';
}

/** Windows paths are case-insensitive. */
export function samePath(a = '', b = '') {
  const norm = (p) => p.replace(/[\\/]+$/, '').replace(/\//g, '\\').toLowerCase();
  return norm(a) === norm(b);
}

const RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)$/i;

/** Makes a title safe to use as a file name on Windows, macOS and Linux. */
export function safeFileName(title) {
  let name = String(title || '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')
    .slice(0, 120);
  if (!name) name = 'Untitled';
  if (RESERVED.test(name)) name += '_';
  return name;
}

export const INVALID_NAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/;
