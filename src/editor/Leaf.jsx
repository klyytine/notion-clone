export default function Leaf({ attributes, children, leaf }) {
  let content = children;
  if (leaf.code) content = <code className="inline-code">{content}</code>;
  if (leaf.bold) content = <strong>{content}</strong>;
  if (leaf.italic) content = <em>{content}</em>;
  if (leaf.underline) content = <u>{content}</u>;
  if (leaf.strikethrough) content = <s>{content}</s>;
  return <span {...attributes}>{content}</span>;
}
