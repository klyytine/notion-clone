import { useEffect, useMemo, useRef, useState } from 'react';
import { usePages } from '../context/PagesContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { buildShareUrl } from '../utils/share';
import ThemeToggle from './ThemeToggle';
import Icon from './Icon';
import FileMenu from './FileMenu';
import { baseName } from '../files/fileApi';

const LONG_LINK = 8000;

function SaveIndicator() {
  const { saveState } = usePages();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);

  let text = 'Saved';
  if (saveState.status === 'saving') text = 'Saving...';
  else if (saveState.status === 'dirty') text = 'Unsaved changes';
  else if (saveState.status === 'error') text = saveState.message || 'Not saved';
  else if (saveState.status === 'saved') {
    const minutes = Math.floor((Date.now() - saveState.at) / 60000);
    text = minutes < 1 ? 'Saved just now' : `Saved ${minutes} min ago`;
  }

  return (
    <span className={`save-indicator ${saveState.status}`} role="status" aria-live="polite" title={saveState.message || undefined}>
      {text}
    </span>
  );
}

function ShareButton({ page }) {
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
        Share
      </button>
      {open && (
        <div className="popover share-popover" role="dialog" aria-label="Share to web">
          <div className="share-title"><Icon name="globe" /> Share to web</div>
          <p className="share-desc">
            Anyone with this link can view a read-only copy of the page. The content is encoded in the link
            itself, so nothing is uploaded. Make new edits? Reopen this to get an updated link.
          </p>
          <div className="share-row">
            <input className="text-input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Share link" />
            <button type="button" className="btn btn-primary" onClick={copy}>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
          <div className="share-meta">
            <a href={url} target="_blank" rel="noreferrer">Open preview ↗</a>
            <span>{(url.length / 1024).toFixed(1)} KB</span>
          </div>
          {url.length > LONG_LINK && (
            <p className="share-warning">
              This link is long because it includes images. Some chat apps may cut it off — removing large
              images or the cover makes it shorter.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Topbar({ page, title, onToggleSidebar }) {
  const { unsavedFiles } = usePages();
  return (
    <div className="topbar">
      <button type="button" className="icon-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar" title="Toggle sidebar">
        <Icon name="menu" size={18} />
      </button>
      <FileMenu />
      <div className="breadcrumb">
        {page ? (
          <>
            <span className="breadcrumb-icon">{page.icon || <Icon name="file" />}</span>
            <span className="breadcrumb-title">{page.title || 'Untitled'}</span>
            {page.filePath && (
              <span className="file-chip" title={page.filePath}>
                {unsavedFiles.has(page.id) && <span className="file-dirty" aria-label="Unsaved changes in file">●</span>}
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
