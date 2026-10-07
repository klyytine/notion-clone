import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { useClickOutside } from '../hooks/useClickOutside';
import { useFileActions } from '../files/FileActions';
import { clearRecent, useRecent } from '../files/recent';
import { baseName } from '../files/fileApi';
import { MOD_LABEL } from '../utils/platform';
import { useT } from '../i18n';

const M = MOD_LABEL;

function MenuItem({ label, shortcut, onClick, disabled, submenu, expanded, ...rest }) {
  return (
    <button
      type="button"
      role="menuitem"
      className="menu-item"
      onClick={onClick}
      disabled={disabled}
      aria-haspopup={submenu ? 'menu' : undefined}
      aria-expanded={submenu ? expanded : undefined}
      {...rest}
    >
      <span className="menu-label">{label}</span>
      {shortcut && <span className="menu-shortcut">{shortcut}</span>}
      {submenu && <Icon name="chevronRight" size={14} className="menu-arrow" />}
    </button>
  );
}

function shortLocation(entry) {
  if (entry.kind === 'url') {
    try {
      return new URL(entry.location).hostname;
    } catch {
      return entry.location;
    }
  }
  const parts = entry.location.split(/[\\/]/).filter(Boolean);
  return parts.length > 2 ? `…\\${parts.slice(-2, -1)[0]}` : entry.location;
}

export default function FileMenu() {
  const t = useT();
  const actions = useFileActions();
  const recent = useRecent();
  const [open, setOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const ref = useRef(null);
  const menuRef = useRef(null);

  const closeMenu = () => {
    setOpen(false);
    setRecentOpen(false);
  };
  useClickOutside(ref, closeMenu, open);

  useEffect(() => {
    if (open) menuRef.current?.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
  }, [open]);

  const run = (fn) => () => {
    closeMenu();
    fn();
  };

  function onKeyDown(event) {
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
    const index = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === 'ArrowRight' && document.activeElement?.dataset.recent === 'toggle') {
      event.preventDefault();
      setRecentOpen(true);
      requestAnimationFrame(() => menuRef.current.querySelector('.submenu [role="menuitem"]')?.focus());
    } else if (event.key === 'ArrowLeft' && recentOpen) {
      event.preventDefault();
      setRecentOpen(false);
      menuRef.current.querySelector('[data-recent="toggle"]')?.focus();
    } else if (event.key === 'Tab') {
      closeMenu();
    }
  }

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        type="button"
        className={`topbar-btn ${open ? 'pressed' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? closeMenu() : setOpen(true))}
      >
        {t('fileMenu.label')}
      </button>

      {open && (
        <div ref={menuRef} className="popover menu" role="menu" aria-label={t('fileMenu.label')} onKeyDown={onKeyDown}>
          <MenuItem label={t('fileMenu.openFile')} shortcut={`${M}+O`} onClick={run(actions.openFile)} />
          <MenuItem label={t('fileMenu.openUrl')} onClick={run(actions.openUrl)} />
          <div className="menu-sub" onMouseEnter={() => setRecentOpen(true)} onMouseLeave={() => setRecentOpen(false)}>
            <MenuItem label={t('fileMenu.openRecent')} submenu expanded={recentOpen} data-recent="toggle" onClick={() => setRecentOpen((o) => !o)} />
            {recentOpen && (
              <div className="popover menu submenu" role="menu" aria-label={t('fileMenu.openRecent')}>
                {recent.length === 0 && <div className="menu-empty">{t('fileMenu.noRecent')}</div>}
                {recent.map((entry) => (
                  <button
                    key={`${entry.kind}:${entry.location}`}
                    type="button"
                    role="menuitem"
                    className="menu-item recent-item"
                    title={entry.location}
                    onClick={run(() => actions.openRecent(entry))}
                  >
                    <Icon name={entry.kind === 'url' ? 'globe' : 'file'} size={15} />
                    <span className="menu-label">{entry.title || baseName(entry.location)}</span>
                    <span className="menu-hint">{shortLocation(entry)}</span>
                  </button>
                ))}
                {recent.length > 0 && (
                  <>
                    <div className="menu-sep" role="separator" />
                    <MenuItem label={t('fileMenu.clearRecent')} onClick={run(clearRecent)} />
                  </>
                )}
              </div>
            )}
          </div>

          <div className="menu-sep" role="separator" />
          <MenuItem label={t('fileMenu.save')} shortcut={`${M}+S`} onClick={run(actions.save)} />
          <MenuItem label={t('fileMenu.saveAs')} shortcut={`${M}+Shift+S`} onClick={run(actions.saveAs)} disabled={!actions.hasPage} />
          <MenuItem label={t('fileMenu.rename')} shortcut="F2" onClick={run(actions.rename)} disabled={!actions.hasPage} />

          <div className="menu-sep" role="separator" />
          <MenuItem label={t('fileMenu.print')} shortcut={`${M}+P`} onClick={run(actions.print)} />

          <div className="menu-sep" role="separator" />
          <MenuItem label={t('fileMenu.preferences')} shortcut={`${M}+,`} onClick={run(actions.preferences)} />

          <div className="menu-sep" role="separator" />
          <MenuItem label={t('fileMenu.quit')} shortcut={`${M}+Q`} onClick={run(actions.quit)} />
        </div>
      )}
    </div>
  );
}
