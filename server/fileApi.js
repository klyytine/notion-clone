// Local file service for the Muistipaikka app, mounted into the Vite dev/preview server.
// Lets the app open/save files by real paths, keep its workspace in a folder,
// fetch URLs without CORS limits, and close its own launcher window.
//
// Only same-origin requests from the app itself are accepted (custom header +
// Host/Origin checks), so other websites can't use it to touch your files.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';

const MAX_BODY_BYTES = 80 * 1024 * 1024;
const MAX_READ_BYTES = 50 * 1024 * 1024;
const MAX_FETCH_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15000;
const LOOPBACK_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;
const HIDDEN_NAMES = new Set(['System Volume Information', '$Recycle.Bin', '$RECYCLE.BIN', 'desktop.ini', 'Thumbs.db']);

// `code` and `params` let the app show the message in the user's language
// (see the `server` keys in src/i18n); `message` is the English fallback.
class HttpError extends Error {
  constructor(status, message, code = null, params = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.params = params;
  }
}

function isAllowed(req) {
  if (req.headers['x-notes-app'] !== '1') return false;
  const host = req.headers.host || '';
  if (!LOOPBACK_HOST.test(host)) return false;
  const origin = req.headers.origin;
  return !origin || origin === `http://${host}`;
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'The request is too large.', 'tooLarge');
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'The request body is not valid JSON.', 'badJson');
  }
}

function absolutePath(value) {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, 'A path is required.', 'pathRequired');
  const trimmed = value.trim();
  if (!path.isAbsolute(trimmed)) {
    const example = path.join(os.homedir(), 'Documents');
    throw new HttpError(400, `Use a full path, for example ${example}`, 'fullPath', { example });
  }
  return path.resolve(trimmed);
}

function friendlyError(err, target) {
  const where = target ? `: ${target}` : '';
  const params = { path: target || '' };
  switch (err.code) {
    case 'ENOENT':
      return new HttpError(404, `Not found${where}`, 'notFound', params);
    case 'EACCES':
    case 'EPERM':
      return new HttpError(403, `Permission denied${where}`, 'permissionDenied', params);
    case 'ENOTDIR':
      return new HttpError(400, `Not a folder${where}`, 'notAFolder', params);
    case 'EISDIR':
      return new HttpError(400, `That is a folder, not a file${where}`, 'isAFolder', params);
    case 'EBUSY':
      return new HttpError(423, `The file is in use by another program${where}`, 'fileBusy', params);
    default:
      return err instanceof HttpError ? err : new HttpError(500, err.message || 'Unexpected error');
  }
}

async function statOrNull(target) {
  try {
    return await fs.stat(target);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function quickPlaces() {
  const home = os.homedir();
  const candidates = [
    ['home', 'Home', home, 'home'],
    ['desktop', 'Desktop', path.join(home, 'Desktop'), 'monitor'],
    ['desktop-onedrive', 'Desktop (OneDrive)', path.join(home, 'OneDrive', 'Desktop'), 'monitor'],
    ['documents', 'Documents', path.join(home, 'Documents'), 'folder'],
    ['documents-onedrive', 'Documents (OneDrive)', path.join(home, 'OneDrive', 'Documents'), 'folder'],
    ['downloads', 'Downloads', path.join(home, 'Downloads'), 'download'],
  ];
  const places = [];
  for (const [id, label, dir, icon] of candidates) {
    const st = await statOrNull(dir).catch(() => null);
    if (st?.isDirectory()) places.push({ id, label, path: dir, icon });
  }

  const drives = [];
  if (process.platform === 'win32') {
    const letters = 'CDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const checks = letters.map((letter) =>
      Promise.race([
        fs.access(`${letter}:\\`).then(() => `${letter}:\\`),
        new Promise((resolve) => setTimeout(() => resolve(null), 400)),
      ]).catch(() => null),
    );
    for (const drive of await Promise.all(checks)) if (drive) drives.push({ label: drive, path: drive, icon: 'hardDrive' });
  } else {
    drives.push({ label: '/', path: '/', icon: 'hardDrive' });
  }
  return [...places, ...drives];
}

const handlers = {
  async 'fs/ping'() {
    return { ok: true, platform: process.platform, sep: path.sep, home: os.homedir(), places: await quickPlaces() };
  },

  async 'fs/list'({ path: input }) {
    const dir = absolutePath(input);
    let dirents;
    try {
      dirents = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      throw friendlyError(err, dir);
    }
    const entries = [];
    for (const d of dirents) {
      if (d.name.startsWith('.') || HIDDEN_NAMES.has(d.name)) continue;
      const full = path.join(dir, d.name);
      try {
        const st = await fs.stat(full);
        entries.push({
          name: d.name,
          path: full,
          kind: st.isDirectory() ? 'dir' : 'file',
          size: st.isDirectory() ? null : st.size,
          mtime: st.mtimeMs,
        });
      } catch {
        // Broken links and locked system files are skipped.
      }
    }
    entries.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }) : a.kind === 'dir' ? -1 : 1));
    const parent = path.dirname(dir);
    return { path: dir, parent: parent === dir ? null : parent, entries };
  },

  async 'fs/stat'({ path: input }) {
    const target = absolutePath(input);
    const st = await statOrNull(target).catch((err) => {
      throw friendlyError(err, target);
    });
    if (!st) return { path: target, exists: false };
    return { path: target, exists: true, kind: st.isDirectory() ? 'dir' : 'file', size: st.size, mtime: st.mtimeMs };
  },

  async 'fs/read'({ path: input }) {
    const target = absolutePath(input);
    try {
      const st = await fs.stat(target);
      if (st.isDirectory()) throw Object.assign(new Error(), { code: 'EISDIR' });
      if (st.size > MAX_READ_BYTES) throw new HttpError(413, 'That file is larger than 50 MB.', 'fileTooLarge');
      return { path: target, content: await fs.readFile(target, 'utf8'), mtime: st.mtimeMs };
    } catch (err) {
      throw friendlyError(err, target);
    }
  },

  async 'fs/write'({ path: input, content, overwrite = false }) {
    const target = absolutePath(input);
    if (typeof content !== 'string') throw new HttpError(400, 'Content must be text.', 'contentNotText');
    try {
      if (!overwrite && (await statOrNull(target))) throw new HttpError(409, `A file with that name already exists: ${target}`, 'alreadyExists', { path: target });
      // Write to a temp file first so a crash never leaves a half-written file behind.
      const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(temp, content, 'utf8');
      await fs.rename(temp, target);
      const st = await fs.stat(target);
      return { path: target, mtime: st.mtimeMs };
    } catch (err) {
      throw friendlyError(err, target);
    }
  },

  async 'fs/rename'({ from, to }) {
    const source = absolutePath(from);
    const target = absolutePath(to);
    try {
      const sameFile = source.toLowerCase() === target.toLowerCase();
      if (!sameFile && (await statOrNull(target))) throw new HttpError(409, `A file with that name already exists: ${target}`, 'alreadyExists', { path: target });
      await fs.rename(source, target);
      return { path: target };
    } catch (err) {
      throw friendlyError(err, source);
    }
  },

  async 'fs/mkdir'({ path: input }) {
    const target = absolutePath(input);
    try {
      await fs.mkdir(target, { recursive: true });
      return { path: target };
    } catch (err) {
      throw friendlyError(err, target);
    }
  },

  async 'fetch-url'({ url }) {
    let parsed;
    try {
      parsed = new URL(String(url));
    } catch {
      throw new HttpError(400, 'That doesn’t look like a web address.', 'badUrl');
    }
    if (!/^https?:$/.test(parsed.protocol)) throw new HttpError(400, 'Only http:// and https:// links can be opened.', 'httpOnly');

    let response;
    try {
      response = await fetch(parsed, {
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { 'User-Agent': 'NotesApp/1.0', Accept: 'text/html,text/markdown,text/plain,application/json;q=0.9,*/*;q=0.5' },
      });
    } catch (err) {
      if (err.name === 'TimeoutError') throw new HttpError(502, 'The site took too long to answer.', 'siteTimeout');
      const reason = err.cause?.code || err.message;
      throw new HttpError(502, `Couldn’t reach that address (${reason}).`, 'siteUnreachable', { reason });
    }
    if (!response.ok) {
      const status = `${response.status} ${response.statusText}`.trim();
      throw new HttpError(502, `The site answered with ${status}.`, 'siteStatus', { status });
    }
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared > MAX_FETCH_BYTES) throw new HttpError(413, 'That page is larger than 10 MB.', 'pageTooLarge');
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_FETCH_BYTES) throw new HttpError(413, 'That page is larger than 10 MB.', 'pageTooLarge');
    return { url: response.url, contentType: response.headers.get('content-type') || '', content: buffer.toString('utf8') };
  },

  async 'app/quit'() {
    // The Windows launcher records its app-window process id here.
    const pidFile = path.join(process.env.LOCALAPPDATA || os.tmpdir(), 'NotesApp', 'window.pid');
    let pid;
    try {
      pid = Number((await fs.readFile(pidFile, 'utf8')).trim());
    } catch {
      return { ok: false };
    }
    if (!Number.isInteger(pid) || pid <= 0) return { ok: false };
    if (process.platform === 'win32') {
      // Without /F this asks the window to close normally, like clicking its X.
      await new Promise((resolve) => execFile('taskkill', ['/PID', String(pid)], () => resolve()));
    } else {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        return { ok: false };
      }
    }
    return { ok: true };
  },
};

async function middleware(req, res, next) {
  if (!req.url?.startsWith('/api/')) return next();
  if (req.method !== 'POST' || !isAllowed(req)) return send(res, 403, { error: 'Forbidden' });
  const name = req.url.slice('/api/'.length).split('?')[0];
  const handler = handlers[name];
  if (!handler) return send(res, 404, { error: 'Unknown endpoint' });
  try {
    const body = await readJsonBody(req);
    send(res, 200, await handler(body));
  } catch (err) {
    const error = friendlyError(err);
    send(res, error.status || 500, { error: error.message, code: error.code || undefined, params: error.params });
  }
}

export function fileApiPlugin() {
  return {
    name: 'notes-file-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
