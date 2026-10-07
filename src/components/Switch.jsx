/** Labelled on/off toggle. */
export default function Switch({ checked, onChange, label, description, disabled = false }) {
  return (
    <label className={`switch-row ${disabled ? 'disabled' : ''}`}>
      <span className="switch-text">
        <span className="switch-label">{label}</span>
        {description && <span className="switch-desc">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb" />
      </button>
    </label>
  );
}
