import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import { format, resolveConfig } from 'prettier';
import { compileSolidBeer } from '../../src/vite';
import { exampleTemplate } from './example-template';
import { compileDemoGroups } from './example-groups';
import { extractExample, nativeExampleSource } from './example-source';

export const exampleSources = (options: { hot?: boolean } = {}): Plugin => {
  // Both Vite hooks consume one source revision; changed source replaces the cached analysis.
  const revisions = new Map<string, { source: string; analysis: ReturnType<typeof compileDemoGroups> }>();
  const analyze = (source: string, filename: string) => {
    let revision = revisions.get(filename);
    if (!revision || revision.source !== source) {
      revision = { source, analysis: compileDemoGroups(source, filename) };
      revisions.set(filename, revision);
    }
    return revision.analysis;
  };
  return {
    name: 'solid-beer:example-sources',
    enforce: 'pre',
    async transform(code, id) {
      if (id.includes('?') || !id.replaceAll('\\', '/').includes('/dev/sections/') || !id.endsWith('.tsx')) return null;
      const result = await analyze(code, id);
      return result && { code: result.code, map: result.map };
    },
    async load(id) {
      const [filename, query] = id.split('?');
      if (query !== 'examples' || !filename?.endsWith('.tsx')) return null;
      this.addWatchFile(filename);
      const source = await readFile(filename, 'utf8');
      const formatting = { ...(await resolveConfig(filename)), filepath: filename };
      const analysis = await analyze(source, filename);
      if (!analysis) throw new Error(`${filename}: no DemoGroup found`);
      const { modes, groups, showcases, originalAst } = analysis;
      const names = [...modes.keys()];
      const templates = new Map<string, string>();
      await Promise.all(
        names
          .filter(name => modes.get(name) !== 'interactive')
          .map(async name => {
            const template = await exampleTemplate(showcases.get(name) ?? originalAst, filename, name);
            if (!template)
              throw new Error(
                `${filename}: ${name} is not a closed showcase; use @demo interactive for state, callbacks, spreads or unknown bindings`,
              );
            templates.set(name, template);
          }),
      );
      const examples = Object.fromEntries(
        await Promise.all(
          [...groups].map(async ([name, selected]) => {
            if (selected.every(name => modes.get(name) === 'showcase')) return [name, { name }];
            const api = await format(await extractExample(originalAst, source, filename, selected), formatting);
            const compiled = await compileSolidBeer(api, filename, { warnClassHelpers: false });
            const native = compiled.report.nativeAvailable
              ? await nativeExampleSource(compiled.code, filename)
              : undefined;
            return [
              name,
              {
                name,
                api,
                native: native && (await format(native, formatting)),
                report: compiled.report,
              },
            ];
          }),
        ),
      );
      const templateAssignments = [...templates]
        .map(([name, template]) => `Object.assign(data[${JSON.stringify(name)}], ${template});`)
        .join('\n');
      const templatePrelude = `import { exampleAttributes, exampleText } from '../site/example';\n`;
      if (options.hot === false)
        return `${templatePrelude}const data = ${JSON.stringify(
          examples,
        )};\n${templateAssignments}\nexport default data;`;
      return `import { createStore, reconcile } from 'solid-js/store';
${templatePrelude}
const data = ${JSON.stringify(examples)};
${templateAssignments}
let examples = data;
if (import.meta.hot) {
  const state = import.meta.hot.data.examples ??= createStore(data);
  state[1](reconcile(data));
  examples = state[0];
  import.meta.hot.accept();
}
export default examples;`;
    },
  };
};
