import { useTheme } from '../context/ThemeContext';
import { MOD_LABEL } from '../utils/platform';
import Icon from './Icon';

export default function ThemeToggle({ className = 'icon-btn', showLabel = false }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode (${MOD_LABEL}+Shift+L)`}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      {showLabel && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
