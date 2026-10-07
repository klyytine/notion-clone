import { useTheme } from '../context/ThemeContext';
import { useT } from '../i18n';
import { MOD_LABEL } from '../utils/platform';
import Icon from './Icon';

export default function ThemeToggle({ className = 'icon-btn', showLabel = false }) {
  const t = useT();
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? t('theme.toLight') : t('theme.toDark');
  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label={label}
      title={`${label} (${MOD_LABEL}+Shift+L)`}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      {showLabel && <span>{theme === 'dark' ? t('theme.light') : t('theme.dark')}</span>}
    </button>
  );
}
