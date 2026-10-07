import { useState } from 'react';
import Modal from './Modal';
import { baseName, extName, safeFileName } from '../files/fileApi';

export function OpenUrlDialog({ onSubmit, onCancel }) {
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
      setError('That doesn’t look like a web address.');
      return;
    }
    setBusy(true);
    setError('');
    const problem = await onSubmit(value);
    setBusy(false);
    if (problem) setError(problem);
  }

  return (
    <Modal title="Open from URL" onClose={onCancel}>
      <form onSubmit={submit}>
        <p className="modal-message">
          Paste a link to a web page, a Markdown or text file, or a <code>.note</code> file. It opens as a new page.
        </p>
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
          aria-label="Web address"
        />
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !url.trim()}>
            {busy ? 'Opening…' : 'Open'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function RenameDialog({ page, canRenameFile, onSubmit, onCancel }) {
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
    <Modal title="Rename" onClose={onCancel}>
      <form onSubmit={submit}>
        <label className="field">
          <span>Page title</span>
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
              Also rename the file on disk
              <span className="check-hint">
                {baseName(page.filePath)} → {newFileName}
              </span>
            </span>
          </label>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>Rename</button>
        </div>
      </form>
    </Modal>
  );
}

export function UnsavedChangesDialog({ onSave, onDiscard, onCancel }) {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      title="Save changes before closing?"
      onClose={onCancel}
      footer={
        <>
          <label className="check-row footer-check">
            <input type="checkbox" checked={dontAskAgain} onChange={(e) => setDontAskAgain(e.target.checked)} />
            <span>Don’t show this again</span>
          </label>
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn" onClick={() => onDiscard(dontAskAgain)}>Don’t Save</button>
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
            {busy ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <p className="modal-message">You have changes that haven’t been saved. If you don’t save, they’ll be lost.</p>
    </Modal>
  );
}

export function MessageDialog({ title, message, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary" data-autofocus onClick={onClose}>OK</button>
      }
    >
      <p className="modal-message">{message}</p>
    </Modal>
  );
}
