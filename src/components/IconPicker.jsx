import { useT } from '../i18n';

export const EMOJIS = [
  '📄', '📝', '📚', '💡', '🚀', '🎯', '✅', '📌',
  '🔥', '⭐', '🧠', '💼', '🗂️', '📅', '🧪', '🎨',
  '🎵', '🌱', '🌍', '🏠', '🍀', '☕', '🐶', '🐱',
  '🦄', '🌈', '⚡', '🔒', '💬', '🎉',
];

export default function IconPicker({ onSelect, onRemove, hasIcon }) {
  const t = useT();
  const random = () => onSelect(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
  return (
    <div className="popover icon-picker" role="dialog" aria-label={t('iconPicker.label')}>
      <div className="icon-picker-header">
        <span className="popover-label">{t('iconPicker.emoji')}</span>
        <div className="icon-picker-tools">
          <button type="button" className="text-btn" onClick={random}>{t('iconPicker.random')}</button>
          {hasIcon && (
            <button type="button" className="text-btn" onClick={onRemove}>{t('common.remove')}</button>
          )}
        </div>
      </div>
      <div className="emoji-grid">
        {EMOJIS.map((emoji) => (
          <button key={emoji} type="button" className="emoji-btn" onClick={() => onSelect(emoji)} aria-label={t('iconPicker.use', { emoji })}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
