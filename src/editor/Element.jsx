import { useState } from 'react';
import { Node, Transforms } from 'slate';
import { ReactEditor, useFocused, useReadOnly, useSelected, useSlateStatic } from 'slate-react';
import ImageSourcePicker from '../components/ImageSourcePicker';
import { t, useT } from '../i18n';

// Keys under editor.placeholder in the language files.
const PLACEHOLDERS = {
  'heading-one': 'heading-one',
  'heading-two': 'heading-two',
  'heading-three': 'heading-three',
  'bulleted-list': 'list',
  'numbered-list': 'list',
  todo: 'todo',
  quote: 'quote',
  callout: 'callout',
};
const ALWAYS_SHOWN = ['heading-one', 'heading-two', 'heading-three'];
const CALLOUT_EMOJIS = ['💡', '⚠️', '📌', '✅', '❗', '🔥'];

function usePlaceholder(element) {
  const selected = useSelected();
  const focused = useFocused();
  const readOnly = useReadOnly();
  useT();
  if (readOnly) return undefined;
  const empty = element.children.length === 1 && element.children[0].text === '';
  if (!empty) return undefined;
  const active = selected && focused;
  if (element.type === 'paragraph') return active ? t('editor.placeholder.paragraph') : undefined;
  if (ALWAYS_SHOWN.includes(element.type) || active) return t(`editor.placeholder.${PLACEHOLDERS[element.type]}`);
  return undefined;
}

function useSetNode(element) {
  const editor = useSlateStatic();
  return (props) => Transforms.setNodes(editor, props, { at: ReactEditor.findPath(editor, element) });
}

export default function Element(props) {
  const { attributes, children, element } = props;
  const placeholder = usePlaceholder(element);
  const ph = placeholder ? { 'data-placeholder': placeholder, className: 'block-content has-placeholder' } : { className: 'block-content' };

  switch (element.type) {
    case 'heading-one':
      return <h1 {...attributes} className="block block-h1"><span {...ph}>{children}</span></h1>;
    case 'heading-two':
      return <h2 {...attributes} className="block block-h2"><span {...ph}>{children}</span></h2>;
    case 'heading-three':
      return <h3 {...attributes} className="block block-h3"><span {...ph}>{children}</span></h3>;
    case 'bulleted-list':
    case 'numbered-list': {
      const indent = element.indent || 0;
      const numbered = element.type === 'numbered-list';
      return (
        <div
          {...attributes}
          className={`block list-item ${numbered ? 'numbered' : 'bulleted'} i${indent}`}
          style={{ '--indent': indent }}
        >
          <span contentEditable={false} className="list-marker" aria-hidden="true">
            {numbered ? null : <span className="bullet" />}
          </span>
          <div {...ph}>{children}</div>
        </div>
      );
    }
    case 'todo':
      return <TodoBlock {...props} ph={ph} />;
    case 'quote':
      return <blockquote {...attributes} className="block block-quote"><div {...ph}>{children}</div></blockquote>;
    case 'callout':
      return <CalloutBlock {...props} ph={ph} />;
    case 'code':
      return <CodeBlock {...props} />;
    case 'divider':
      return <DividerBlock {...props} />;
    case 'image':
      return <ImageBlock {...props} />;
    default:
      return <div {...attributes} className="block block-paragraph"><div {...ph}>{children}</div></div>;
  }
}

function TodoBlock({ attributes, children, element, ph }) {
  useT();
  const readOnly = useReadOnly();
  const setNode = useSetNode(element);
  const indent = element.indent || 0;
  return (
    <div
      {...attributes}
      className={`block list-item todo i${indent} ${element.checked ? 'checked' : ''}`}
      style={{ '--indent': indent }}
    >
      <span contentEditable={false} className="list-marker">
        <button
          type="button"
          role="checkbox"
          aria-checked={!!element.checked}
          aria-label={element.checked ? t('editor.markNotDone') : t('editor.markDone')}
          className="todo-checkbox"
          disabled={readOnly}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setNode({ checked: !element.checked })}
        />
      </span>
      <div {...ph}>{children}</div>
    </div>
  );
}

function CalloutBlock({ attributes, children, element, ph }) {
  useT();
  const readOnly = useReadOnly();
  const setNode = useSetNode(element);
  const cycleEmoji = () => {
    const i = CALLOUT_EMOJIS.indexOf(element.emoji);
    setNode({ emoji: CALLOUT_EMOJIS[(i + 1) % CALLOUT_EMOJIS.length] });
  };
  return (
    <div {...attributes} className="block block-callout">
      <span contentEditable={false} className="callout-emoji">
        <button
          type="button"
          disabled={readOnly}
          onMouseDown={(e) => e.preventDefault()}
          onClick={cycleEmoji}
          title={t('editor.changeEmoji')}
        >
          {element.emoji || '💡'}
        </button>
      </span>
      <div {...ph}>{children}</div>
    </div>
  );
}

function CodeBlock({ attributes, children, element }) {
  useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(Node.string(element));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div {...attributes} className="block block-code">
      <div contentEditable={false} className="code-toolbar">
        <span className="code-lang">{t('editor.code')}</span>
        <button type="button" className="code-copy" onMouseDown={(e) => e.preventDefault()} onClick={copy}>
          {copied ? t('common.copied') : t('common.copy')}
        </button>
      </div>
      <pre spellCheck={false}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

function DividerBlock({ attributes, children }) {
  const selected = useSelected();
  const focused = useFocused();
  return (
    <div {...attributes} className={`block block-divider ${selected && focused ? 'is-selected' : ''}`}>
      <div contentEditable={false}>
        <hr />
      </div>
      {children}
    </div>
  );
}

function ImageBlock({ attributes, children, element }) {
  useT();
  const editor = useSlateStatic();
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();
  const [broken, setBroken] = useState(false);
  const setNode = useSetNode(element);
  const remove = () => Transforms.removeNodes(editor, { at: ReactEditor.findPath(editor, element) });

  let body;
  if (element.url) {
    body = (
      <figure className={`image-figure ${selected && focused ? 'is-selected' : ''}`}>
        {broken ? (
          <div className="image-broken">{t('editor.imageBroken')}</div>
        ) : (
          <img src={element.url} alt="" onError={() => setBroken(true)} draggable={false} />
        )}
        {!readOnly && (
          <div className="image-actions">
            <button type="button" onClick={() => { setBroken(false); setNode({ url: '' }); }}>{t('common.replace')}</button>
            <button type="button" onClick={remove}>{t('common.delete')}</button>
          </div>
        )}
      </figure>
    );
  } else if (!readOnly) {
    body = <ImageSourcePicker onPick={(url) => setNode({ url })} onCancel={remove} autoFocus />;
  } else {
    body = null;
  }

  return (
    <div {...attributes} className="block block-image">
      <div contentEditable={false}>{body}</div>
      {children}
    </div>
  );
}
