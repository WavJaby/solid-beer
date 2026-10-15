import type { Accessor, JSX } from 'solid-js';
import { beerClass, type BeerRecipe } from 'src/appearance';

export const exampleText = (value: unknown) =>
  (typeof value === 'boolean' ? '' : String(value ?? ''))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');

/** Build-generated templates supply evaluated options, not source expressions or an AST. */
export const exampleAttributes = (values: Record<string, unknown>, recipe: BeerRecipe | undefined) => {
  const appearance = Object.keys(recipe?.options ?? {});
  const falseOptions = recipe
    ? Object.fromEntries(
        Object.entries(recipe.options).filter(([key, token]) => typeof token === 'string' && values[key] === false),
      )
    : {};
  const classes = beerClass({ tag: '', options: falseOptions }, values);
  const result: string[] = [];
  if (classes)
    result.push(
      ` class=${JSON.stringify(classes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'))}`,
    );
  for (const [key, value] of Object.entries(values)) {
    if (['class', 'classes', 'classList'].includes(key) || value === undefined) continue;
    if (
      value === false &&
      (appearance.includes(key) ||
        ['disabled', 'checked', 'selected', 'hidden', 'required', 'readOnly', 'multiple', 'autofocus'].includes(key))
    )
      continue;
    const name = key;
    if (value === true && !key.startsWith('aria-') && !key.startsWith('data-')) {
      result.push(` ${name}`);
      continue;
    }
    if (typeof value === 'string')
      result.push(
        ` ${name}=${JSON.stringify(value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'))}`,
      );
    else result.push(` ${name}={${JSON.stringify(value)}}`);
  }
  return result.join('');
};

export interface DemoSource {
  readonly code: string;
  readonly nativeCode?: string;
  readonly interactiveCode?: string;
  readonly interactiveNativeCode?: string;
}

/** Generated direct snippets contain a fixed import prelude + a JSX body. */
export const joinExampleCode = (snippets: readonly string[]) => {
  const imports = new Set<string>();
  const bodies = snippets.map(snippet => {
    if (!snippet.startsWith('import ')) return snippet;
    const boundary = snippet.indexOf('\n\n');
    snippet
      .slice(0, boundary)
      .split('\n')
      .forEach(line => {
        if (line.startsWith('import { ') && line.endsWith(" } from 'solid-beer';"))
          line
            .slice('import { '.length, -" } from 'solid-beer';".length)
            .split(', ')
            .forEach(name => imports.add(name));
      });
    return snippet.slice(boundary + 2);
  });
  const body =
    bodies.length === 1
      ? bodies[0]
      : `<>\n${bodies
          .map(body =>
            body
              .split('\n')
              .map(line => '  ' + line)
              .join('\n'),
          )
          .join('\n')}\n</>`;
  return (imports.size ? `import { ${[...imports].join(', ')} } from 'solid-beer';\n\n` : '') + body;
};

export interface DemoEntry extends DemoSource {
  render: () => JSX.Element;
}

export interface ExampleModeControl {
  mode: Accessor<'native' | 'component'>;
  setMode: (mode: 'native' | 'component') => void;
}

/** Only showcase option values cross this boundary; callbacks/objects belong inside the example component. */
export const optionCode = (name: string, value: unknown): string => {
  if (value === undefined) return '';
  if (value !== null && !['string', 'number', 'boolean'].includes(typeof value))
    throw new Error(`Demo option ${name} must be a scalar; move complex props into the example component`);
  return ` ${name}={${JSON.stringify(value)}}`;
};
