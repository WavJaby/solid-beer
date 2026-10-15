/// <reference path="../dev/site/example-source.d.ts" />
// @vitest-environment node
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { parseAsync } from '@babel/core';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { compileDemoGroups } from '../dev/site/example-groups';
import { extractExample } from '../dev/site/example-source';
import { exampleTemplate } from '../dev/site/example-template';
import { exampleSources } from '../dev/site/example-plugin';
import { exampleAttributes, joinExampleCode } from '../dev/site/example';
import { beerRecipes } from '../src/appearance';
import { compileSolidBeer } from '../src/vite';
import controls from '../dev/sections/Controls.tsx?examples';
import surfaces from '../dev/sections/Surfaces.tsx?examples';
import progress from '../dev/sections/Progress.tsx?examples';
import badges from '../dev/sections/Badges.tsx?examples';
import buttons from '../dev/sections/Buttons.tsx?examples';
import custom from '../dev/sections/CustomComponents.tsx?examples';
import menus from '../dev/sections/Menus.tsx?examples';
import dialogs from '../dev/sections/CustomDialogs.tsx?examples';
import panels from '../dev/sections/CustomExpansions.tsx?examples';
import tables from '../dev/sections/CustomTables.tsx?examples';
import structure from '../dev/sections/Structure.tsx?examples';
import expansions from '../dev/sections/Expansions.tsx?examples';
import nativeDialogs from '../dev/sections/Dialogs.tsx?examples';
import nativeTables from '../dev/sections/Tables.tsx?examples';

vi.mock('@babel/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@babel/core')>();
  return { ...actual, parseAsync: vi.fn(actual.parseAsync) };
});

const parseFixture = async (source: string, filename: string) =>
  (await parseAsync(source, {
    filename,
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: ['jsx', 'typescript'] },
  }))!;

const individual = (sources: typeof controls) =>
  Object.fromEntries(Object.entries(sources).filter(([name]) => !name.includes('+')));
const examples = individual({ ...controls, ...surfaces, ...progress, ...badges, ...buttons });
const workflows = individual({ ...custom, ...menus, ...dialogs, ...panels, ...tables });
const nativeExamples = individual({ ...structure, ...expansions, ...nativeDialogs, ...nativeTables });

describe('Build-time example source', () => {
  it('shares one original parse across preview and repeated source loads, replacing it on source edits', async () => {
    const filename = resolve('dev/sections/Controls.tsx');
    const source = await readFile(filename, 'utf8');
    const parser = vi.mocked(parseAsync);
    parser.mockClear();
    const plugin = exampleSources({ hot: false });
    const transform = plugin.transform as (code: string, id: string) => Promise<unknown>;
    const load = plugin.load as (this: { addWatchFile: (id: string) => void }, id: string) => Promise<string>;
    const context = { addWatchFile: vi.fn() };
    const [preview, copied] = await Promise.all([
      transform(source, filename),
      load.call(context, filename + '?examples'),
    ]);
    expect(preview).not.toBeNull();
    expect(copied).toContain('CheckboxExample');
    expect(copied).not.toContain('__capture');
    expect(await transform(source, filename)).toEqual(preview);
    expect(await load.call(context, filename + '?examples')).toBe(copied);
    expect(parser).toHaveBeenCalledTimes(1); // One parse for the unchanged revision, including both Vite hooks.
    expect(parser.mock.calls[0]![0]).toBe(source);
    const edited = source + '\n// Edited revision\n';
    await transform(edited, filename);
    await transform(edited, filename);
    expect(parser.mock.calls.map(([code]) => code)).toEqual([source, edited]);
    expect(context.addWatchFile).toHaveBeenCalledWith(filename);
  });

  it('requires an explicit representation and generates only its declared getter path', async () => {
    const prefix = "import { DemoGroup } from '../site/Demo';\n";
    const section = 'const Section = () => <DemoGroup title="Test"><TestExample /></DemoGroup>;';
    await expect(
      compileDemoGroups(prefix + 'export const TestExample = () => <div />;' + section, '/dev/sections/Test.tsx'),
    ).rejects.toThrow('add // @demo showcase or // @demo interactive');
    const showcase = await compileDemoGroups(
      prefix + '// @demo showcase\nexport const TestExample = () => <div />;' + section,
      '/dev/sections/Test.tsx',
    );
    expect(showcase!.code).toContain('apiTemplate(');
    expect(showcase!.code).not.toContain('TestExample.api ');
    const interactive = await compileDemoGroups(
      prefix + '// @demo interactive\nexport const TestExample = () => <div />;' + section,
      '/dev/sections/Test.tsx',
    );
    expect(interactive!.code).not.toContain('Template');
    expect(interactive!.modes.get('TestExample')).toBe('interactive');
  });
  it('indents direct children by JSX depth and aligns the root closing tag', () => {
    const source = buttons.IconTextButtonExample!.apiTemplate!({
      color: '',
      size: 'medium',
      elevation: 'none',
      vertical: false,
    });
    expect(source.split('\n\n')[1]).toBe(
      '<Button size="medium" elevation="none">\n  <Icon>home</Icon>\n  <span>Button</span>\n</Button>',
    );
  });
  it('rejects invalid marked regions and removes metadata from live output', async () => {
    const prefix = "import {DemoGroup} from '../site/Demo';\n// @demo interactive\n";
    const section = 'const Section = () => <DemoGroup title="Test"><TestExample /></DemoGroup>;';
    for (const body of [
      '(props) => {return <div data-demo-showcase />;}',
      '() => {return <><div data-demo-showcase /><div data-demo-showcase /></>;}',
      '() => {return <div data-demo-showcase {...settings} />;}',
      '() => {return <div data-demo-showcase ref={element} />;}',
    ])
      await expect(
        compileDemoGroups(prefix + 'export const TestExample = ' + body + ';' + section, '/dev/sections/Test.tsx'),
      ).rejects.toThrow('showcase');
    const result = await compileDemoGroups(
      prefix +
        'export const TestExample = () => {const value = () => true; return <input data-demo-showcase checked={value()} />;};' +
        section,
      '/dev/sections/Test.tsx',
    );
    expect(result!.modes.get('TestExample')).toBe('both');
    expect(result!.showcases.has('TestExample')).toBe(true);
    expect(result!.code).not.toContain('data-demo-showcase');
    const original = JSON.stringify(result!.originalAst);
    expect(original).toContain('data-demo-showcase');
    expect(original).not.toContain('__capture');
    const source = result!.map!.sourcesContent![0]!;
    const api = await extractExample(result!.originalAst, source, '/dev/sections/Test.tsx', 'TestExample');
    expect(api).not.toMatch(/data-demo-showcase|__capture|@demo|demoSources/);
    expect(api).toContain('checked={value()}');
    expect(JSON.stringify(result!.originalAst)).toBe(original);
  });
  it('keeps one stateful definition with both copy representations', () => {
    for (const [name, metadata] of Object.entries({ ...controls, ...surfaces })) {
      if (!metadata!.apiTemplate || !metadata!.api) continue;
      const source = metadata!.api!;
      expect(source, name).toContain('createSignal(');
      expect(source, name).not.toMatch(/Controlled|@demo|data-demo-showcase|__capture|Pick<|EventHandlerUnion/);
      expect(source.match(/export const /g), name).toHaveLength(1);
      expect(metadata!.native, name).toBeDefined();
    }
    const source = controls.CheckboxExample!.api!;
    expect(source.match(/<Checkbox /g)).toHaveLength(1);
    expect(source).toContain('checked={checked()}');
  });
  it('omits false appearance flags after removing conflicting helpers, preserving meaningful false attributes', () => {
    const code = exampleAttributes(
      { class: 'border primary', border: false, disabled: false, 'aria-expanded': false },
      beerRecipes.Button,
    );
    expect(code).toContain('class="primary"');
    expect(code).not.toContain('border');
    expect(code).not.toContain('disabled');
    expect(code).toContain('aria-expanded={false}');
    expect(exampleAttributes({ class: 'wavy', wavy: false }, beerRecipes.Progress)).toBe('');
  });
  it('prints true flags as JSX shorthand while preserving ARIA and data values', () => {
    const code = exampleAttributes(
      { border: true, disabled: true, 'aria-expanded': true, 'data-enabled': true },
      beerRecipes.Button,
    );
    expect(code).toContain(' border disabled');
    expect(code).not.toContain('border={true}');
    expect(code).toContain('aria-expanded={true}');
    expect(code).toContain('data-enabled={true}');
  });
  it('specializes colors and typed params into direct JSX without example wrappers', () => {
    const values = { color: 'secondary', size: 'large', elevation: 'none', vertical: false };
    const api = buttons.PlainButtonExample!.apiTemplate!(values);
    const native = buttons.PlainButtonExample!.nativeTemplate!(values);
    expect(api).toContain('class="secondary"');
    expect(api).toContain('size="large"');
    expect(api).not.toMatch(/props\.|classes=|Example|classList/);
    expect(native).toContain('<button');
    expect(native).toContain('secondary');
    expect(native).toContain('large');
    const grouped = joinExampleCode([api, buttons.IconTextButtonExample!.apiTemplate!(values)]);
    expect(grouped.match(/from 'solid-beer'/g)).toHaveLength(1);
    expect(grouped.match(/\bButton\b/g)!.length).toBeGreaterThan(1);
    expect(grouped).toContain('Icon');
  });

  it('retains stateful examples and unknown calculations instead of evaluating them at build time', async () => {
    const stateful = `import {createSignal} from 'solid-js'; import {Badge} from 'solid-beer'; export const StatefulExample = (props: {color: string}) => { const [active, setActive] = createSignal(false); return <Badge classes={[props.color]} classList={{active: active()}} onClick={() => setActive(true)}>New</Badge>; };`;
    expect(
      await exampleTemplate(await parseFixture(stateful, '/demo.tsx'), '/demo.tsx', 'StatefulExample'),
    ).toBeUndefined();
    expect(
      await exampleTemplate(
        await parseFixture(
          `import {Badge} from 'solid-beer'; export const UnknownExample = () => <Badge classes={[lookup()]} />;`,
          '/demo.tsx',
        ),
        '/demo.tsx',
        'UnknownExample',
      ),
    ).toBeUndefined();
  });
  it('generates Native source for every migrated example without retaining component wrappers', () => {
    for (const [name, source] of Object.entries(examples)) {
      if (source.apiTemplate) {
        expect(source.nativeTemplate, name).toBeDefined();
        if (!source.api) {
          expect(source.native, name).toBeUndefined();
          expect(source.report, name).toBeUndefined();
        }
      } else {
        expect(source.native, name).toBeDefined();
        expect(source.report!.fallbacks, name).toEqual({});
        expect(source.report!.retained, name).toEqual([]);
        expect(source.api, name).toContain(`export const ${name}`);
        expect(source.api, name).not.toMatch(/DemoGroup|sourceSample|\?examples|nativeSamples/);
        expect(source.native, name).not.toMatch(/beerClass|progressClass|splitProps/);
      }
    }
  });

  it('typechecks copied API and Native modules independently with public imports', () => {
    const sources = new Map<string, string>();
    for (const [name, source] of Object.entries({
      ...controls,
      ...surfaces,
      ...progress,
      ...badges,
      ...buttons,
      ...custom,
      ...menus,
      ...dialogs,
      ...panels,
      ...tables,
      ...structure,
      ...expansions,
      ...nativeDialogs,
      ...nativeTables,
    })) {
      const names = name.split('+');
      const usage =
        '\n\n' +
        (names.length > 1 ? '<>\n' : '') +
        names.map(name => `<${name} />`).join('\n') +
        (names.length > 1 ? '\n</>' : '');
      if (source.api) sources.set(resolve(`test/copied-${name}-api.tsx`), source.api + usage);
      if (source.apiTemplate)
        sources.set(
          resolve(`test/direct-${name}-api.tsx`),
          "import type { JSX } from 'solid-js';\n" + source.apiTemplate({}),
        );
      if (source.nativeTemplate)
        sources.set(
          resolve(`test/direct-${name}-native.tsx`),
          "import type { JSX } from 'solid-js';\n" + source.nativeTemplate({}),
        );
      if (source.native) sources.set(resolve(`test/copied-${name}-native.tsx`), source.native + usage);
    }
    const host = ts.createCompilerHost({});
    const readFile = host.readFile;
    const fileExists = host.fileExists;
    host.readFile = filename => sources.get(resolve(filename)) ?? readFile(filename);
    host.fileExists = filename => sources.has(resolve(filename)) || fileExists(filename);
    host.getSourceFile = (filename, languageVersion) => {
      const text = host.readFile(filename);
      return text === undefined ? undefined : ts.createSourceFile(filename, text, languageVersion);
    };
    const program = ts.createProgram(
      [...sources.keys()],
      {
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        jsx: ts.JsxEmit.Preserve,
        jsxImportSource: 'solid-js',
        baseUrl: process.cwd(),
        paths: { 'solid-beer': ['src/index.tsx'] },
      },
      host,
    );
    const errors = ts.getPreEmitDiagnostics(program).filter(error => error.category === ts.DiagnosticCategory.Error);
    expect(
      ts.formatDiagnosticsWithColorAndContext(errors, {
        getCurrentDirectory: () => process.cwd(),
        getCanonicalFileName: path => path,
        getNewLine: () => '\n',
      }),
    ).toBe('');
  });

  it('copies custom workflows from their real source while retaining runtime behavior', () => {
    for (const [name, source] of Object.entries(workflows)) {
      if (source.report!.nativeAvailable) expect(source.native, name).toBeDefined();
      else expect(source.native, name).toBeUndefined();
      expect(source.api, name).not.toMatch(/DemoGroup|sourceSample|\?examples/);
    }
    expect(custom.SearchExample!.api).toContain('renderOption');
    expect(custom.SearchExample!.api).toContain('const users');
    expect(custom.SearchExample!.api).toContain('const searchUsers');
    expect(custom.AccountExample!.api).toContain('const fileDataUrl');
    expect(custom.AccountExample!.api).toContain('setUser');
    const stacked = dialogs.StackedDialogExample!;
    const grouped = Object.entries(dialogs).find(
      ([name]) => name.includes('+') && name.split('+').includes('StackedDialogExample'),
    )![1];
    for (const source of [stacked.api!, grouped.api!]) {
      expect(source.match(/const RecursiveDialog:/g)).toHaveLength(1); // Self-reference must not duplicate the helper in Copy all.
      expect(source).toContain('dialog.show(RecursiveDialog');
    }
    expect(stacked.report!.nativeAvailable).toBe(true);
    expect(stacked.native).toContain('const RecursiveDialog');
  });

  it('keeps transitive module bindings and side-effect imports, removing unrelated examples', async () => {
    const source = `import './theme.css'; import { Card, Chip, type CardProps } from 'solid-beer';
      interface Props { border?: CardProps['border']; }
      const title = 'Shared'; const content = () => title;
      export const CardExample = (props: Props) => <Card border={props.border}>{content()}</Card>;
      export const OtherExample = () => <Chip>Other</Chip>;`;
    const filename = '/fixture/examples.tsx';
    const ast = await parseFixture(source, filename);
    const original = JSON.stringify(ast);
    const [api, other, grouped] = await Promise.all([
      extractExample(ast, source, filename, 'CardExample'),
      extractExample(ast, source, filename, 'OtherExample'),
      extractExample(ast, source, filename, ['CardExample', 'OtherExample']),
    ]);
    expect(api).toContain("import './theme.css'");
    expect(api).toContain("const title = 'Shared'");
    expect(api).toContain('const content');
    expect(api).toContain('interface Props');
    expect(api).toContain('type CardProps');
    expect(api).not.toContain('OtherExample');
    expect(api).not.toContain('Chip');
    expect(other).toContain('OtherExample');
    expect(other).not.toContain('CardExample');
    expect(grouped).toContain('CardExample');
    expect(grouped).toContain('OtherExample');
    expect(grouped.match(/const title =/g)).toHaveLength(1); // The shared declaration must appear once in Copy all.
    expect(JSON.stringify(ast)).toBe(original);
    const native = await compileSolidBeer(api, '/fixture/examples.tsx');
    expect(native.code).toContain('<article class={');
    await expect(extractExample(ast, source, filename, 'MissingExample')).rejects.toThrow(
      'Unknown example export',
    );
  });

  it('records unsupported dynamic classes, spreads and custom workflow components without executing expressions', async () => {
    const result = await compileSolidBeer(
      `import { Card, Progress, SearchSelect } from 'solid-beer';
      export const Example = () => <><Card class={unknown()} /><Progress {...settings()} /><SearchSelect search={search} setSelected={select} /></>;`,
      '/fixture/examples.tsx',
    );
    expect(result.report.fallbacks).toEqual({ 'dynamic-appearance': 1, spread: 1 }); // One dynamic-class call + one unknown spread.
    expect(result.report.retained).toEqual(['Card', 'Progress', 'SearchSelect']);
    expect(result.code).toContain('unknown()');
    expect(result.code).toContain('settings()');
  });

  it('compiles direct JSX before Solid, injecting lazy source getters and render factories', async () => {
    const source = `import { DemoGroup as Showcase } from '../site/Demo';
      import { Card } from 'solid-beer';
      // @demo showcase
      export const CardExample = (props: { border?: boolean }) => <Card border={props.border} />;
      export const Section = () => <Showcase title="Card"><CardExample border={enabled()} /></Showcase>;`;
    const output = await compileDemoGroups(source, '/dev/sections/Cards.tsx');
    expect(output!.code).toContain('./Cards.tsx?examples');
    expect(output!.code).toContain('render: () => <CardExample border={enabled()} />');
    expect(output!.code).toContain('get code()');
    expect(output!.code).toContain('get nativeCode()');
    expect(output!.code).not.toMatch(/sourceSample|sampleCode|samples=/);
    expect(output!.map?.sourcesContent).toEqual([source]);
    expect(output!.map?.mappings).not.toBe('');
    const example = output!.originalAst.program.body.find(node => node.type === 'ExportNamedDeclaration');
    expect(example!.loc!.start.line).toBe(
      source.slice(0, source.indexOf('export const CardExample')).split('\n').length,
    );
    expect(await compileDemoGroups('export const Plain = () => <div />;', '/dev/sections/Plain.tsx')).toBeNull();
  });

  it('rejects showcase ambiguity at build time instead of silently dropping code', async () => {
    const prefix = `import { DemoGroup } from '../site/Demo';\n// @demo showcase\nexport const CardExample = () => <div />;`;
    for (const child of [
      '<CardExample {...settings()} />',
      '<CardExample attr:value={1} />',
      '<CardExample handler={() => undefined} />',
      '<CardExample data={{}} />',
      '{items.map(render)}',
      '<div />',
      '<CardExample>Text</CardExample>',
    ]) {
      await expect(
        compileDemoGroups(
          prefix + `const Section = () => <DemoGroup title="Test">${child}</DemoGroup>;`,
          '/dev/sections/Invalid.tsx',
        ),
      ).rejects.toThrow();
    }
    await expect(
      compileDemoGroups(prefix + 'const Section = () => <DemoGroup title="Empty" />;', '/dev/sections/Empty.tsx'),
    ).rejects.toThrow('at least one example');
    await expect(
      compileDemoGroups(
        `import { DemoGroup } from '../site/Demo'; const PrivateExample = () => <div />; const Section = () => <DemoGroup title="Test"><PrivateExample /></DemoGroup>;`,
        '/dev/sections/Private.tsx',
      ),
    ).rejects.toThrow('Export PrivateExample');
    await expect(
      compileDemoGroups(
        `import { DemoGroup } from '../site/Demo'; export const Untagged = () => <div />; const Section = () => <DemoGroup title="Test"><Untagged /></DemoGroup>;`,
        '/dev/sections/Name.tsx',
      ),
    ).rejects.toThrow('must end with Example');
  });
});
