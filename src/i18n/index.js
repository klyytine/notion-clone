import { useSyncExternalStore } from 'react';
import en from './en';
import fi from './fi';

// Minimal i18n: nested dictionaries, {name} placeholders, and plural forms
// ({ one, other }) picked with Intl.PluralRules when a `count` is passed.
// The current language lives here (not only in React state) so plain modules
// such as file parsers and error messages can translate too.

export const LANGUAGES = {
  fi: { label: 'Suomi', locale: 'fi-FI', dict: fi },
  en: { label: 'English', locale: 'en-US', dict: en },
};
export const DEFAULT_LANGUAGE = 'fi';

let current = DEFAULT_LANGUAGE;
const listeners = new Set();

export const isLanguage = (lang) => Object.hasOwn(LANGUAGES, lang);
export const getLanguage = () => current;
export const getLocale = () => LANGUAGES[current].locale;

export function setLanguage(lang) {
  if (!isLanguage(lang)) return;
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  if (lang === current) return;
  current = lang;
  listeners.forEach((fn) => fn());
}

function lookup(dict, key) {
  let node = dict;
  for (const part of key.split('.')) {
    node = node?.[part];
    if (node === undefined) return undefined;
  }
  return node;
}

/** Translates `key` in the current language, falling back to English, then the key itself. */
export function t(key, params = {}) {
  let value = lookup(LANGUAGES[current].dict, key) ?? lookup(en, key);
  if (value === undefined) return key;
  if (typeof value === 'object' && !Array.isArray(value)) {
    const form = typeof params.count === 'number' ? new Intl.PluralRules(getLocale()).select(params.count) : 'other';
    value = value[form] ?? value.other;
  }
  if (typeof value !== 'string') return value;
  return value.replace(/\{(\w+)\}/g, (match, name) => {
    if (!(name in params)) return match;
    const v = params[name];
    return typeof v === 'number' ? v.toLocaleString(getLocale()) : String(v);
  });
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-renders the calling component when the language changes. */
export function useLanguage() {
  return useSyncExternalStore(subscribe, getLanguage);
}

/** `const t = useT();` — same as the plain `t`, but subscribes the component to language changes. */
export function useT() {
  useLanguage();
  return t;
}
