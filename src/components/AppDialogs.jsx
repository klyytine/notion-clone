import { useState } from 'react';
import Modal from './Modal';
import { baseName, extName, safeFileName } from '../files/fileApi';
import { useT } from '../i18n';

export function OpenUrlDialog({ onSubmit, onCancel }) {
  const t = useT();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    let value = url.trim();
    if (!value) return;
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    try {
      new URL(value);
    } catch {
      setError(t('urlDialog.invalid'));
      return;
    }
    setBusy(true);
    setError('');
    const problem = await onSubmit(value);
    setBusy(false);
    if (problem) setError(problem);
  }

  return (
    <Modal title={t('urlDialog.title')} onClose={onCancel}>
      <form onSubmit={submit}>
        <p className="modal-message">{t('urlDialog.message')}</p>
        <input
          className="text-input wide-input"
          type="url"
          placeholder="https://example.com/notes.md"
          value={url}
          autoFocus
          onChange={(e) => {
            setUrl(e.target.value);
            setError('');
          }}
          aria-label={t('urlDialog.label')}
        />
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>{t('common.cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !url.trim()}>
            {busy ? t('urlDialog.opening') : t('common.open')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function RenameDialog({ page, canRenameFile, onSubmit, onCancel }) {
  const t = useT();
  const [title, setTitle] = useState(page.title);
  const [renameFile, setRenameFile] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const newFileName = page.filePath ? safeFileName(title) + extName(page.filePath) : '';

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const problem = await onSubmit({ title: title.trim(), renameFile: !!page.filePath && canRenameFile && renameFile });
    setBusy(false);
    if (problem) setError(problem);
  }

  return (
    <Modal title={t('renameDialog.title')} onClose={onCancel}>
      <form onSubmit={submit}>
        <label className="field">
          <span>{t('renameDialog.pageTitle')}</span>
          <input
            className="text-input wide-input"
            value={title}
            autoFocus
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
          />
        </label>
        {page.filePath && (
          <label className="check-row">
            <input
              type="checkbox"
              checked={renameFile && canRenameFile}
              disabled={!canRenameFile}
              onChange={(e) => setRenameFile(e.target.checked)}
            />
            <span>
              {t('renameDialog.alsoRenameFile')}
              <span className="check-hint">
                {baseName(page.filePath)} → {newFileName}
              </span>
            </span>
          </label>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>{t('common.cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{t('renameDialog.title')}</button>
        </div>
      </form>
    </Modal>
  );
}

export function UnsavedChangesDialog({ onSave, onDiscard, onCancel }) {
  const t = useT();
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      title={t('unsavedDialog.title')}
      onClose={onCancel}
      footer={
        <>
          <label className="check-row footer-check">
            <input type="checkbox" checked={dontAskAgain} onChange={(e) => setDontAskAgain(e.target.checked)} />
            <span>{t('unsavedDialog.dontShowAgain')}</span>
          </label>
          <button type="button" className="btn" onClick={onCancel}>{t('common.cancel')}</button>
          <button type="button" className="btn" onClick={() => onDiscard(dontAskAgain)}>{t('unsavedDialog.dontSave')}</button>
          <button
            type="button"
            className="btn btn-primary"
            data-autofocus
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onSave(dontAskAgain);
              setBusy(false);
            }}
          >
            {busy ? t('common.savingEllipsis') : t('common.save')}
          </button>
        </>
      }
    >
      <p className="modal-message">{t('unsavedDialog.message')}</p>
    </Modal>
  );
}

export function MessageDialog({ title, message, onClose }) {
  const t = useT();
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary" data-autofocus onClick={onClose}>{t('common.ok')}</button>
      }
    >
      <p className="modal-message">{message}</p>
    </Modal>
  );
}
