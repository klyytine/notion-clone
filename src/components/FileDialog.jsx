import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { INVALID_NAME_CHARS, extName, fileApi, joinPath } from '../files/fileApi';
import { OPENABLE_EXTENSIONS, SAVE_FORMATS } from '../files/documents';

const TITLES = { open: 'Open file', save: 'Save as', folder: 'Choose a folder' };
const ACTIONS = { open: 'Open', save: 'Save', folder: 'Select folder' };

function formatSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const formatDate = (ms) => new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

/**
 * File browser backed by the local file service, so every file has a real path.
 * mode: 'open' → onSubmit(path) · 'save' → onSubmit({ path, format }) · 'folder' → onSubmit(path)
 */
export default function FileDialog({ mode, service, startDir, suggestedName = '', initialFormat = 'note', onSubmit, onCancel, onUseSystemDialog }) {
  const [dir, setDir] = useState(null);
  const [parent, setParent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [pathInput, setPathInput] = useState(startDir || service.home);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState(suggestedName);
  const [format, setFormat] = useState(initialFormat);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(null);
  const listRef = useRef(null);

  const go = useCallback(async (target, { fallback } = {}) => {
    setLoading(true);
    setError('');
    try {
      const result = await fileApi.list(target);
      setDir(result.path);
      setParent(result.parent);
      setEntries(result.entries);
      setPathInput(result.path);
      setSelected(null);
      setConfirmOverwrite(null);
      listRef.current?.scrollTo(0, 0);
    } catch (err) {
      if (fallback) await go(fallback);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    go(startDir || service.home, { fallback: service.home });
  }, [go, startDir, service.home]);

  const visible = entries.filter(
    (e) => e.kind === 'dir' || (mode !== 'folder' && (showAll || OPENABLE_EXTENSIONS.includes(extName(e.name)) || (mode === 'save' && extName(e.name) === SAVE_FORMATS[format].ext))),
  );

  async function submitPathBar(event) {
    event.preventDefault();
    const target = pathInput.trim();
    if (!target) return;
    try {
      const st = await fileApi.stat(target);
      if (st.exists && st.kind === 'file' && mode === 'open') onSubmit(st.path);
      else if (st.exists && st.kind === 'file') setError('That is a file. Enter a folder.');
      else if (!st.exists) setError(`Not found: ${target}`);
      else go(st.path);
    } catch (err) {
      setError(err.message);
    }
  }

  function activate(entry) {
    if (entry.kind === 'dir') go(entry.path);
    else if (mode === 'open') onSubmit(entry.path);
    else if (mode === 'save') {
      setName(entry.name);
      submitSave(entry.name);
    }
  }

  function select(entry) {
    setSelected(entry.path);
    if (mode === 'save' && entry.kind === 'file') setName(entry.name);
  }

  async function submitSave(fileName = name) {
    let finalName = fileName.trim();
    if (!finalName) {
      setError('Enter a file name.');
      return;
    }
    if (INVALID_NAME_CHARS.test(finalName)) {
      setError('A file name can’t contain any of these characters: \\ / : * ? " < > |');
      return;
    }
    const ext = SAVE_FORMATS[format].ext;
    if (extName(finalName) !== ext) finalName += ext;
    const target = joinPath(dir, finalName);
    try {
      const st = await fileApi.stat(target);
      if (st.exists && st.kind === 'dir') {
        setError('A folder with that name already exists.');
        return;
      }
      if (st.exists && confirmOverwrite !== target) {
        setConfirmOverwrite(target);
        setName(finalName);
        return;
      }
      onSubmit({ path: target, format });
    } catch (err) {
      setError(err.message);
    }
  }

  function submit() {
    if (mode === 'save') return submitSave();
    const entry = entries.find((e) => e.path === selected);
    if (mode === 'folder') return onSubmit(entry?.kind === 'dir' ? entry.path : dir);
    if (entry?.kind === 'file') return onSubmit(entry.path);
    if (entry?.kind === 'dir') return go(entry.path);
    setError('Choose a file to open.');
    return undefined;
  }

  function onListKeyDown(event) {
    if (!visible.length) return;
    const index = visible.findIndex((e) => e.path === selected);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = visible[Math.max(0, Math.min(visible.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))];
      select(next);
      listRef.current?.querySelector(`[data-path="${CSS.escape(next.path)}"]`)?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && index >= 0) {
      event.preventDefault();
      activate(visible[index]);
    } else if (event.key === 'Backspace' && parent) {
      event.preventDefault();
      go(parent);
    }
  }

  const footer = (
    <>
      {mode === 'open' && onUseSystemDialog && (
        <button type="button" className="text-btn fd-system" onClick={onUseSystemDialog}>
          Use the system dialog instead…
        </button>
      )}
      <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      <button type="button" className="btn btn-primary" onClick={submit} disabled={loading || !dir}>
        {confirmOverwrite ? 'Replace' : ACTIONS[mode]}
      </button>
    </>
  );

  return (
    <Modal title={TITLES[mode]} onClose={onCancel} size="xl" footer={footer}>
      <div className="fd">
        <nav className="fd-places" aria-label="Places">
          {service.places.map((place) => (
            <button
              key={place.path}
              type="button"
              className={`fd-place ${dir === place.path ? 'active' : ''}`}
              onClick={() => go(place.path)}
              title={place.path}
            >
              <Icon name={place.icon} size={15} />
              <span>{place.label}</span>
            </button>
          ))}
        </nav>

        <div className="fd-main">
          <form className="fd-pathbar" onSubmit={submitPathBar}>
            <button type="button" className="icon-btn" onClick={() => parent && go(parent)} disabled={!parent} aria-label="Up one folder" title="Up one folder">
              <Icon name="arrowUp" />
            </button>
            <input
              className="text-input"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              aria-label="Folder path"
              spellCheck={false}
            />
            <button type="submit" className="btn">Go</button>
          </form>

          <div ref={listRef} className="fd-list" role="listbox" aria-label="Files" tabIndex={0} onKeyDown={onListKeyDown}>
            {loading && !entries.length && <div className="fd-empty">Loading…</div>}
            {!loading && !visible.length && <div className="fd-empty">This folder is empty.</div>}
            {visible.map((entry) => (
              <button
                key={entry.path}
                type="button"
                role="option"
                aria-selected={selected === entry.path}
                data-path={entry.path}
                className={`fd-entry ${selected === entry.path ? 'selected' : ''}`}
                onClick={() => select(entry)}
                onDoubleClick={() => activate(entry)}
              >
                <Icon name={entry.kind === 'dir' ? 'folder' : 'file'} size={16} />
                <span className="fd-name">{entry.name}</span>
                <span className="fd-meta">{entry.kind === 'file' ? formatSize(entry.size) : ''}</span>
                <span className="fd-meta">{formatDate(entry.mtime)}</span>
              </button>
            ))}
          </div>

          {mode === 'save' && (
            <div className="fd-savebar">
              <label className="fd-field">
                <span>File name</span>
                <input
                  className="text-input"
                  value={name}
                  data-autofocus
                  onChange={(e) => {
                    setName(e.target.value);
                    setConfirmOverwrite(null);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitSave();
                    }
                  }}
                  spellCheck={false}
                />
              </label>
              <label className="fd-field">
                <span>Save as type</span>
                <select className="text-input" value={format} onChange={(e) => setFormat(e.target.value)}>
                  {Object.entries(SAVE_FORMATS).map(([key, f]) => (
                    <option key={key} value={key}>{f.label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {mode === 'open' && (
            <label className="fd-filter">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Show all files (normally .note, .md, .txt and .json)
            </label>
          )}

          {confirmOverwrite && (
            <p className="fd-warning" role="alert">
              “{confirmOverwrite}” already exists. Click <b>Replace</b> to overwrite it.
            </p>
          )}
          {error && <p className="fd-error" role="alert">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}
