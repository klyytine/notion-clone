import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import IconPicker from './IconPicker';
import ImageSourcePicker from './ImageSourcePicker';
import { useClickOutside } from '../hooks/useClickOutside';

function TitleInput({ value, onChange, onEnter, autoFocus }) {
  const ref = useRef(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  };
  useLayoutEffect(resize, [value]);
  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <textarea
      ref={ref}
      className="page-title"
      rows={1}
      placeholder="Untitled"
      value={value}
      autoFocus={autoFocus}
      aria-label="Page title"
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ''))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || (e.key === 'ArrowDown' && e.target.selectionStart === value.length)) {
          e.preventDefault();
          onEnter?.();
        }
      }}
    />
  );
}

function Cover({ url, readOnly, onChange, onRemove }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  return (
    <div className="page-cover">
      {broken ? <div className="page-cover-broken" /> : <img src={url} alt="" onError={() => setBroken(true)} />}
      {!readOnly && (
        <div className="cover-actions">
          <button type="button" className="cover-btn" onClick={onChange}>Change cover</button>
          <button type="button" className="cover-btn" onClick={onRemove}>Remove cover</button>
        </div>
      )}
    </div>
  );
}

export default function PageHeader({ page, onUpdate, onTitleEnter, readOnly = false }) {
  const [iconOpen, setIconOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const iconRef = useRef(null);
  const coverRef = useRef(null);

  useClickOutside(iconRef, () => setIconOpen(false), iconOpen);
  useClickOutside(coverRef, () => setCoverOpen(false), coverOpen);

  const picker = iconOpen && (
    <IconPicker
      hasIcon={!!page.icon}
      onSelect={(icon) => {
        onUpdate({ icon });
        setIconOpen(false);
      }}
      onRemove={() => {
        onUpdate({ icon: null });
        setIconOpen(false);
      }}
    />
  );

  const classes = ['page-header', page.cover && 'has-cover', page.icon && 'has-icon', (iconOpen || coverOpen) && 'is-active'];

  return (
    <header className={classes.filter(Boolean).join(' ')}>
      {page.cover && (
        <Cover
          url={page.cover}
          readOnly={readOnly}
          onChange={() => setCoverOpen(true)}
          onRemove={() => onUpdate({ cover: null })}
        />
      )}

      <div className="page-header-inner">
        {page.icon && (
          <div className="icon-anchor" ref={iconRef}>
            {readOnly ? (
              <div className="page-icon">{page.icon}</div>
            ) : (
              <button type="button" className="page-icon" onClick={() => setIconOpen((o) => !o)} aria-label="Change icon" title="Change icon">
                {page.icon}
              </button>
            )}
            {picker}
          </div>
        )}

        {!readOnly && (
          <div className="page-actions">
            {!page.icon && (
              <div className="icon-anchor" ref={iconRef}>
                <button type="button" className="action-btn add-icon" onClick={() => setIconOpen((o) => !o)}>
                  Add icon
                </button>
                {picker}
              </div>
            )}
            {!page.cover && (
              <button type="button" className="action-btn add-cover" onClick={() => setCoverOpen(true)}>
                Add cover
              </button>
            )}
          </div>
        )}

        {coverOpen && (
          <div className="cover-picker-panel" ref={coverRef}>
            <ImageSourcePicker
              onPick={(cover) => {
                onUpdate({ cover });
                setCoverOpen(false);
              }}
              onCancel={() => setCoverOpen(false)}
            />
          </div>
        )}

        {readOnly ? (
          <h1 className="page-title">{page.title || 'Untitled'}</h1>
        ) : (
          <TitleInput
            value={page.title}
            autoFocus={!page.title}
            onChange={(title) => onUpdate({ title })}
            onEnter={onTitleEnter}
          />
        )}
      </div>
    </header>
  );
}
