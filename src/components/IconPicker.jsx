export const EMOJIS = [
  '📄', '📝', '📚', '💡', '🚀', '🎯', '✅', '📌',
  '🔥', '⭐', '🧠', '💼', '🗂️', '📅', '🧪', '🎨',
  '🎵', '🌱', '🌍', '🏠', '🍀', '☕', '🐶', '🐱',
  '🦄', '🌈', '⚡', '🔒', '💬', '🎉',
];

export default function IconPicker({ onSelect, onRemove, hasIcon }) {
  const random = () => onSelect(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
  return (
    <div className="popover icon-picker" role="dialog" aria-label="Choose an icon">
      <div className="icon-picker-header">
        <span className="popover-label">Emoji</span>
        <div className="icon-picker-tools">
          <button type="button" className="text-btn" onClick={random}>Random</button>
          {hasIcon && (
            <button type="button" className="text-btn" onClick={onRemove}>Remove</button>
          )}
        </div>
      </div>
      <div className="emoji-grid">
        {EMOJIS.map((emoji) => (
          <button key={emoji} type="button" className="emoji-btn" onClick={() => onSelect(emoji)} aria-label={`Use ${emoji}`}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
