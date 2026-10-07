import { sanitizeContent } from '../editor/schema';
import { isSafeImageUrl } from './image';

function toBase64Url(bytes) {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Serializes a page snapshot into URL-safe base64 (UTF-8 JSON underneath). */
export function encodePage(page) {
  const payload = { v: 1, title: page.title, icon: page.icon, cover: page.cover, content: page.content };
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

/** Decodes and validates a shared snapshot. Throws on malformed input. */
export function decodePage(encoded) {
  if (!encoded) throw new Error('Empty link');
  const data = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded)));
  if (!data || typeof data !== 'object') throw new Error('Invalid page data');
  return {
    title: typeof data.title === 'string' ? data.title.slice(0, 500) : '',
    icon: typeof data.icon === 'string' ? data.icon.slice(0, 16) : null,
    cover: isSafeImageUrl(data.cover) ? data.cover : null,
    content: sanitizeContent(data.content),
  };
}

// The snapshot lives in the URL fragment, so it is never sent to any server.
export function buildShareUrl(page) {
  return `${window.location.origin}/share#${encodePage(page)}`;
}
