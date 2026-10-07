import { useState } from 'react';
import Modal from './Modal';
import Switch from './Switch';
import FileDialog from './FileDialog';
import { AUTOSAVE_MAX_MS, AUTOSAVE_MIN_MS, clampDelay, usePrefs } from '../context/PrefsContext';
import { usePages } from '../context/PagesContext';
import { fileApi, joinPath, samePath } from '../files/fileApi';
import { LOCAL_KEY, WORKSPACE_FILE, parseWorkspace, saveLocalPages, serializeWorkspace } from '../files/workspace';

function suggestFolder(service) {
  const docs = service?.places.find((p) => p.label.startsWith('Documents')) || service?.places[0];
  return docs ? joinPath(docs.path, 'Notes') : '';
}

function StorageSection({ service }) {
  const { prefs, updatePrefs } = usePrefs();
  const { pages, flush } = usePages();
  const current = prefs.storageFolder;
  const [mode, setMode] = useState(current ? 'folder' : 'browser');
  const [folder, setFolder] = useState(current || suggestFolder(service));
  const [browsing, setBrowsing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(null); // { count } when the folder already has notes

  const available = !!service;
  const changed = mode === 'browser' ? !!current : !current || !samePath(folder.trim(), current);

  async function apply(choice) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (!(await flush())) throw new Error('Your current notes couldn’t be saved first. Fix that before switching.');

      if (mode === 'browser') {
        try {
          saveLocalPages(pages);
        } catch (err) {
          throw new Error(err.name === 'QuotaExceededError' ? 'Your notes are too large for browser storage (about 5 MB). Keep using a folder.' : err.message);
        }
        updatePrefs({ storageFolder: null });
        setNotice('Notes are now saved in this browser. Your folder was left unchanged.');
        return;
      }

      const dir = folder.trim();
      if (!dir) throw new Error('Enter a folder path.');
      const st = await fileApi.stat(dir);
      if (st.exists && st.kind !== 'dir') throw new Error('That path is a file, not a folder.');
      if (!st.exists) await fileApi.mkdir(dir);

      const workspacePath = joinPath(st.path, WORKSPACE_FILE);
      const existing = await fileApi.stat(workspacePath);
      if (existing.exists && !choice) {
        let count = 0;
        try {
          count = parseWorkspace((await fileApi.read(workspacePath)).content).length;
        } catch {
          /* unreadable: still offer to replace it */
        }
        setConflict({ count });
        return;
      }
      if (!existing.exists || choice === 'replace') {
        await fileApi.write(workspacePath, serializeWorkspace(pages), { overwrite: true });
      }
      setConflict(null);
      updatePrefs({ storageFolder: st.path });
      setFolder(st.path);
      setNotice(
        choice === 'use'
          ? `Opened the notes stored in ${st.path}.`
          : `Your notes are now saved in ${joinPath(st.path, WORKSPACE_FILE)}.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="prefs-section">
      <h3>Storage</h3>
      <p className="prefs-hint">Where your pages are kept.</p>

      <label className="radio-row">
        <input type="radio" name="storage" checked={mode === 'browser'} onChange={() => { setMode('browser'); setConflict(null); }} />
        <span>
          <span className="radio-label">This browser</span>
          <span className="radio-desc">Stored in the app’s local storage (about 5 MB, images included).</span>
        </span>
      </label>

      <label className={`radio-row ${available ? '' : 'disabled'}`}>
        <input type="radio" name="storage" checked={mode === 'folder'} disabled={!available} onChange={() => setMode('folder')} />
        <span>
          <span className="radio-label">A folder on this computer</span>
          <span className="radio-desc">
            {available
              ? `Saved as ${WORKSPACE_FILE} in the folder you choose. No size limit, and easy to back up or sync.`
              : 'Needs the app’s file service. Start the app with run.bat or “npm run dev” to use this.'}
          </span>
        </span>
      </label>

      {mode === 'folder' && available && (
        <div className="folder-row">
          <input
            className="text-input"
            value={folder}
            onChange={(e) => {
              setFolder(e.target.value);
              setConflict(null);
            }}
            placeholder="C:\\Users\\you\\Documents\\Notes"
            aria-label="Notes folder path"
            spellCheck={false}
          />
          <button type="button" className="btn" onClick={() => setBrowsing(true)}>Browse…</button>
        </div>
      )}

      {current && (
        <p className="prefs-current">
          Currently: <code>{joinPath(current, WORKSPACE_FILE)}</code>
        </p>
      )}
      {!current && <p className="prefs-current">Currently: this browser (<code>{LOCAL_KEY}</code>)</p>}

      {conflict ? (
        <div className="prefs-conflict" role="alert">
          <p>
            This folder already has notes ({conflict.count} {conflict.count === 1 ? 'page' : 'pages'}). What should happen?
          </p>
          <div className="prefs-conflict-actions">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => apply('use')}>Open those notes</button>
            <button type="button" className="btn btn-danger" disabled={busy} onClick={() => apply('replace')}>Replace them with my current notes</button>
            <button type="button" className="btn" onClick={() => setConflict(null)}>Cancel</button>
          </div>
        </div>
      ) : (
        changed && (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => apply()}>
            {busy ? 'Applying…' : 'Apply storage location'}
          </button>
        )
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
      {notice && <p className="prefs-notice" role="status">{notice}</p>}

      {browsing && (
        <FileDialog
          mode="folder"
          service={service}
          startDir={folder.trim() || service.home}
          onCancel={() => setBrowsing(false)}
          onSubmit={(path) => {
            setFolder(path);
            setConflict(null);
            setBrowsing(false);
          }}
        />
      )}
    </section>
  );
}

function DelayInput() {
  const { prefs, updatePrefs } = usePrefs();
  const [draft, setDraft] = useState(String(prefs.autosaveDelay));
  const commit = () => {
    const value = clampDelay(draft);
    setDraft(String(value));
    updatePrefs({ autosaveDelay: value });
  };
  return (
    <label className={`number-row ${prefs.autosave ? '' : 'disabled'}`}>
      <span className="switch-text">
        <span className="switch-label">Autosave delay</span>
        <span className="switch-desc">
          Wait this long after you stop typing before saving ({AUTOSAVE_MIN_MS.toLocaleString()}–{AUTOSAVE_MAX_MS.toLocaleString()} ms).
        </span>
      </span>
      <span className="number-input">
        <input
          className="text-input"
          type="number"
          inputMode="numeric"
          min={AUTOSAVE_MIN_MS}
          max={AUTOSAVE_MAX_MS}
          step={100}
          value={draft}
          disabled={!prefs.autosave}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          aria-label="Autosave delay in milliseconds"
        />
        <span>ms</span>
      </span>
    </label>
  );
}

export default function PreferencesDialog({ service, onClose }) {
  const { prefs, updatePrefs } = usePrefs();

  return (
    <Modal title="Preferences" onClose={onClose} size="wide" footer={<button type="button" className="btn btn-primary" onClick={onClose}>Done</button>}>
      <div className="prefs">
        <StorageSection service={service} />

        <section className="prefs-section">
          <h3>Saving</h3>
          <Switch
            label="Autosave"
            description="Save automatically while you work. When off, use File → Save (Ctrl+S)."
            checked={prefs.autosave}
            onChange={(autosave) => updatePrefs({ autosave })}
          />
          <DelayInput />
          <Switch
            label="Ask to save unsaved changes when closing"
            description="Shown when you quit or close the window with unsaved changes."
            checked={prefs.confirmOnClose}
            onChange={(confirmOnClose) => updatePrefs({ confirmOnClose })}
          />
        </section>

        <section className="prefs-section">
          <h3>Editor</h3>
          <Switch
            label="Show line numbers"
            description="Numbers every block in the left margin."
            checked={prefs.showLineNumbers}
            onChange={(showLineNumbers) => updatePrefs({ showLineNumbers })}
          />
          <Switch
            label="Show word count"
            description="Words, characters and paragraphs in a bar at the bottom of the page."
            checked={prefs.showWordCount}
            onChange={(showWordCount) => updatePrefs({ showWordCount })}
          />
        </section>
      </div>
    </Modal>
  );
}
