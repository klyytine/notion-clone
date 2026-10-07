import { useMemo } from 'react';
import { countStats } from '../files/documents';
import { useT } from '../i18n';

export default function StatusBar({ content }) {
  const t = useT();
  const { words, characters, paragraphs } = useMemo(() => countStats(content), [content]);
  return (
    <div className="status-bar" role="status" aria-live="off">
      <span>{t('status.words', { count: words })}</span>
      <span>{t('status.characters', { count: characters })}</span>
      <span>{t('status.paragraphs', { count: paragraphs })}</span>
    </div>
  );
}
