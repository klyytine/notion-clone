import { useEffect, useMemo, useRef, useState } from 'react';
import { usePages } from '../context/PagesContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { buildShareUrl } from '../utils/share';
import ThemeToggle from './ThemeToggle';
import Icon from './Icon';
import FileMenu from './FileMenu';
import { baseName } from '../files/fileApi';
import { getLocale, useT } from '../i18n';

const LONG_LINK = 8000;

function SaveIndicator() {
  const { saveState } = usePages();
  const t = useT();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);

  let text = t('saveStatus.saved');
  if (saveState.status === 'saving') text = t('saveStatus.saving');
  else if (saveState.status === 'dirty') text = t('saveStatus.dirty');
  else if (saveState.status === 'error') text = saveState.message || t('saveStatus.notSaved');
  else if (saveState.status === 'saved') {
    const minutes = Math.floor((Date.now() - saveState.at) / 60000);
    text = minutes < 1 ? t('saveStatus.justNow') : t('saveStatus.minutesAgo', { count: minutes });
  }

  return (
    <span className={`save-indicator ${saveState.status}`} role="status" aria-live="polite" title={saveState.message || undefined}>
      {text}
    </span>
  );
}

function ShareButton({ page }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const url = useMemo(() => (open ? buildShareUrl(page) : ''), [open, page]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      ref.current?.querySelector('input')?.select();
      document.execCommand?.('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="share-anchor" ref={ref}>
      <button type="button" className="topbar-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {t('topbar.share')}
      </button>
      {open && (
        <div className="popover share-popover" role="dialog" aria-label={t('share.title')}>
          <div className="share-title"><Icon name="globe" /> {t('share.title')}</div>
          <p className="share-desc">{t('share.description')}</p>
          <div className="share-row">
            <input className="text-input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label={t('share.linkLabel')} />
            <button type="button" className="btn btn-primary" onClick={copy}>
              {copied ? t('share.copied') : t('share.copy')}
            </button>
          </div>
          <div className="share-meta">
            <a href={url} target="_blank" rel="noreferrer">{t('share.preview')}</a>
            <span>{(url.length / 1024).toLocaleString(getLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KB</span>
          </div>
          {url.length > LONG_LINK && (
            <p className="share-warning">{t('share.longLink')}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Topbar({ page, title, onToggleSidebar }) {
  const { unsavedFiles } = usePages();
  const t = useT();
  return (
    <div className="topbar">
      <button type="button" className="icon-btn" onClick={onToggleSidebar} aria-label={t('topbar.toggleSidebar')} title={t('topbar.toggleSidebar')}>
        <Icon name="menu" size={18} />
      </button>
      <FileMenu />
      <div className="breadcrumb">
        {page ? (
          <>
            <span className="breadcrumb-icon">{page.icon || <Icon name="file" />}</span>
            <span className="breadcrumb-title">{page.title || t('common.untitled')}</span>
            {page.filePath && (
              <span className="file-chip" title={page.filePath}>
                {unsavedFiles.has(page.id) && <span className="file-dirty" aria-label={t('topbar.fileUnsaved')}>●</span>}
                {baseName(page.filePath)}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="breadcrumb-icon"><Icon name="help" /></span>
            <span className="breadcrumb-title">{title}</span>
          </>
        )}
      </div>
      <div className="topbar-right">
        <SaveIndicator />
        {page && <ShareButton page={page} />}
        <ThemeToggle />
      </div>
    </div>
  );
}
