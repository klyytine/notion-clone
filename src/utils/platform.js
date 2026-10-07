export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const MOD_LABEL = IS_MAC ? '⌘' : 'Ctrl';
export const ALT_LABEL = IS_MAC ? '⌥' : 'Shift';
