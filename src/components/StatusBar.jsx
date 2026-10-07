import { useMemo } from 'react';
import { countStats } from '../files/documents';

const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;

export default function StatusBar({ content }) {
  const { words, characters, paragraphs } = useMemo(() => countStats(content), [content]);
  return (
    <div className="status-bar" role="status" aria-live="off">
      <span>{plural(words, 'word')}</span>
      <span>{plural(characters, 'character')}</span>
      <span>{plural(paragraphs, 'paragraph')}</span>
    </div>
  );
}
