import type { JSX } from 'solid-js';

// Minimal JSX tokenizer: tag delimiters+names, attribute names, quoted strings, single-level `{}` expressions. Anything else passes through as plain text.
const TOKEN =
  /(<\/?)([A-Za-z][\w.]*)|(\/?>)|([A-Za-z_-][\w-]*)(?==)|("[^"]*"|'[^']*'|`[^`]*`)|(\{[^{}]*\})|(\/\/[^\n]*)/g;

const span = (text: string, className: string) => <span class={className}>{text}</span>;

/** Highlight JSX source with BeerCSS text-color helpers so the palette follows the active theme. */
export const highlightJsx = (code: string): JSX.Element[] => {
  const out: JSX.Element[] = [];
  let last = 0;
  for (const match of code.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) out.push(code.slice(last, index));
    const [text, open, tag, close, attr, str, expr, comment] = match;
    if (open != null) out.push(span(open + (tag ?? ''), 'primary-text'));
    else if (close != null) out.push(span(close, 'primary-text'));
    else if (attr != null) out.push(span(attr, 'secondary-text'));
    else if (str != null) out.push(span(str, 'tertiary-text'));
    else if (expr != null) out.push(span(expr, 'medium-opacity'));
    else if (comment != null) out.push(span(comment, 'small-opacity'));
    else out.push(text);
    last = index + text.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
};
