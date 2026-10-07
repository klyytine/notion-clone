import { useState } from 'react';
import Modal from './Modal';
import Switch from './Switch';
import FileDialog from './FileDialog';
import { AUTOSAVE_MAX_MS, AUTOSAVE_MIN_MS, clampDelay, usePrefs } from '../context/PrefsContext';
import { usePages } from '../context/PagesContext';
import { fileApi, joinPath, samePath } from '../files/fileApi';
import { LOCAL_KEY, WORKSPACE_FILE, parseWorkspace, saveLocalPages, serializeWorkspace } from '../files/workspace';
import { LANGUAGES, t, useT } from '../i18n';
import { MOD_LABEL } from '../utils/platform';

function suggestFolder(service) {
  const docs = service?.places.find((p) => p.id === 'documents') || service?.places[0];
  return docs ? joinPath(docs.path, t('prefs.storage.suggestedFolder')) : '';
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
      if (!(await flush())) throw new Error(t('prefs.storage.saveFirstFailed'));

      if (mode === 'browser') {
        try {
          saveLocalPages(pages);
        } catch (err) {
          throw new Error(err.name === 'QuotaExceededError' ? t('prefs.storage.tooLargeForBrowser') : err.message);
        }
        updatePrefs({ storageFolder: null });
        setNotice(t('prefs.storage.nowInBrowser'));
        return;
      }

      const dir = folder.trim();
      if (!dir) throw new Error(t('prefs.storage.enterFolder'));
      const st = await fileApi.stat(dir);
      if (st.exists && st.kind !== 'dir') throw new Error(t('prefs.storage.isFile'));
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
          ? t('prefs.storage.openedFrom', { path: st.path })
          : t('prefs.storage.nowInFolder', { path: joinPath(st.path, WORKSPACE_FILE) }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="prefs-section">
      <h3>{t('prefs.storage.heading')}</h3>
      <p className="prefs-hint">{t('prefs.storage.hint')}</p>

      <label className="radio-row">
        <input type="radio" name="storage" checked={mode === 'browser'} onChange={() => { setMode('browser'); setConflict(null); }} />
        <span>
          <span className="radio-label">{t('prefs.storage.browser')}</span>
          <span className="radio-desc">{t('prefs.storage.browserDesc')}</span>
        </span>
      </label>

      <label className={`radio-row ${available ? '' : 'disabled'}`}>
        <input type="radio" name="storage" checked={mode === 'folder'} disabled={!available} onChange={() => setMode('folder')} />
        <span>
          <span className="radio-label">{t('prefs.storage.folder')}</span>
          <span className="radio-desc">
            {available ? t('prefs.storage.folderDesc', { file: WORKSPACE_FILE }) : t('prefs.storage.folderUnavailable')}
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
            placeholder={t('prefs.storage.folderPlaceholder')}
            aria-label={t('prefs.storage.folderLabel')}
            spellCheck={false}
          />
          <button type="button" className="btn" onClick={() => setBrowsing(true)}>{t('common.browse')}</button>
        </div>
      )}

      {current && (
        <p className="prefs-current">
          {t('prefs.storage.current')} <code>{joinPath(current, WORKSPACE_FILE)}</code>
        </p>
      )}
      {!current && <p className="prefs-current">{t('prefs.storage.current')} {t('prefs.storage.currentBrowser')} (<code>{LOCAL_KEY}</code>)</p>}

      {conflict ? (
        <div className="prefs-conflict" role="alert">
          <p>{t('prefs.storage.conflict', { count: conflict.count })}</p>
          <div className="prefs-conflict-actions">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => apply('use')}>{t('prefs.storage.openThose')}</button>
            <button type="button" className="btn btn-danger" disabled={busy} onClick={() => apply('replace')}>{t('prefs.storage.replaceThem')}</button>
            <button type="button" className="btn" onClick={() => setConflict(null)}>{t('common.cancel')}</button>
          </div>
        </div>
      ) : (
        changed && (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => apply()}>
            {busy ? t('prefs.storage.applying') : t('prefs.storage.apply')}
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
        <span className="switch-label">{t('prefs.saving.delay')}</span>
        <span className="switch-desc">{t('prefs.saving.delayDesc', { min: AUTOSAVE_MIN_MS, max: AUTOSAVE_MAX_MS })}</span>
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
          aria-label={t('prefs.saving.delayLabel')}
        />
        <span>ms</span>
      </span>
    </label>
  );
}

export default function PreferencesDialog({ service, onClose }) {
  const { prefs, updatePrefs } = usePrefs();
  useT();

  return (
    <Modal title={t('prefs.title')} onClose={onClose} size="wide" footer={<button type="button" className="btn btn-primary" onClick={onClose}>{t('common.done')}</button>}>
      <div className="prefs">
        <section className="prefs-section">
          <h3>{t('prefs.language.heading')}</h3>
          <p className="prefs-hint">{t('prefs.language.hint')}</p>
          <div className="language-options" role="radiogroup" aria-label={t('prefs.language.heading')}>
            {Object.entries(LANGUAGES).map(([code, lang]) => (
              <label key={code} className="radio-row" lang={code}>
                <input type="radio" name="language" checked={prefs.language === code} onChange={() => updatePrefs({ language: code })} />
                <span className="radio-label">{lang.label}</span>
              </label>
            ))}
          </div>
        </section>

        <StorageSection service={service} />

        <section className="prefs-section">
          <h3>{t('prefs.saving.heading')}</h3>
          <Switch
            label={t('prefs.saving.autosave')}
            description={t('prefs.saving.autosaveDesc', { shortcut: `${MOD_LABEL}+S` })}
            checked={prefs.autosave}
            onChange={(autosave) => updatePrefs({ autosave })}
          />
          <DelayInput />
          <Switch
            label={t('prefs.saving.confirmOnClose')}
            description={t('prefs.saving.confirmOnCloseDesc')}
            checked={prefs.confirmOnClose}
            onChange={(confirmOnClose) => updatePrefs({ confirmOnClose })}
          />
        </section>

        <section className="prefs-section">
          <h3>{t('prefs.editor.heading')}</h3>
          <Switch
            label={t('prefs.editor.lineNumbers')}
            description={t('prefs.editor.lineNumbersDesc')}
            checked={prefs.showLineNumbers}
            onChange={(showLineNumbers) => updatePrefs({ showLineNumbers })}
          />
          <Switch
            label={t('prefs.editor.wordCount')}
            description={t('prefs.editor.wordCountDesc')}
            checked={prefs.showWordCount}
            onChange={(showWordCount) => updatePrefs({ showWordCount })}
          />
        </section>
      </div>
    </Modal>
  );
}
