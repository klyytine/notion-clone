import { useRef, useState } from 'react';
import { isSafeImageUrl, preloadImage, readImageFile } from '../utils/image';

/**
 * Two side-by-side ways to pick an image:
 *   [Upload Image]   OR   [URL input] [Add Link] [Cancel]
 * Uploads become base64 data URLs, so nothing needs external hosting.
 */
export default function ImageSourcePicker({ onPick, onCancel, autoFocus = false }) {
  const fileRef = useRef(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onPick(await readImageFile(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const value = url.trim();
    if (!isSafeImageUrl(value)) {
      setError('Enter an image link that starts with http:// or https://');
      return;
    }
    setBusy(true);
    setError('');
    try {
      onPick(await preloadImage(value));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="image-picker"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onCancel();
        }
      }}
    >
      <div className="image-picker-row">
        <div className="image-picker-upload">
          <button type="button" className="btn btn-primary" onClick={() => fileRef.current.click()} disabled={busy}>
            Upload Image
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
        </div>

        <span className="image-picker-or">or</span>

        <form className="image-picker-url" onSubmit={handleSubmit}>
          <input
            type="url"
            className="text-input"
            placeholder="Paste an image link…"
            value={url}
            autoFocus={autoFocus}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            aria-label="Image link"
          />
          <button type="submit" className="btn btn-primary" disabled={busy || !url.trim()}>
            Add Link
          </button>
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        </form>
      </div>
      {busy && <p className="image-picker-hint">Loading image…</p>}
      {error && (
        <p className="image-picker-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
