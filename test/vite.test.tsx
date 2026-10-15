// @vitest-environment node
import { transformAsync } from '@babel/core';
import { build } from 'esbuild';
import { build as viteBuild, resolveConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { describe, expect, it } from 'vitest';
import solidBeer, { compileSolidBeer, type SolidBeerOptions, type SolidBeerTransformReport } from '../src/vite';

type Transform = (
  this: { warn(message: string): void },
  code: string,
  id: string,
) => Promise<{ code: string; map: unknown } | null>;
const lower = async (source: string, options: SolidBeerOptions = {}, id = '/consumer/example.tsx') => {
  const reports: SolidBeerTransformReport[] = [];
  const warnings: string[] = [];
  const plugin = solidBeer({ ...options, onReport: report => reports.push(report) });
  const output = await (plugin.transform as Transform).call({ warn: message => warnings.push(message) }, source, id);
  return { code: output?.code ?? source, output, reports, warnings };
};
const importProgress = 'import { Progress } from "solid-beer";';

describe('Native source availability', () => {
  it.each([
    ['export const view = <button>Native</button>;', true],
    ["import type {ButtonProps} from 'solid-beer'; export const view = <button />;", true],
    ["import {type ButtonProps} from 'solid-beer'; export const view = <button />;", true],
    ["import {Button as Action} from 'src'; export const view = <Action />;", true],
    [
      "import {Button, SearchSelect} from 'solid-beer'; export const view = <><Button /><SearchSelect {...settings} /></>;",
      false,
    ],
    [
      "import {Button, dialog} from 'solid-beer'; export const view = <Button onClick={() => dialog.alert('Hi')} />;",
      true,
    ],
    ["import {dialog} from 'solid-beer'; export const view = <button onClick={() => dialog.alert('Hi')} />;", false],
    ["import * as beer from 'solid-beer'; export const view = <beer.Button />;", false],
    ["import 'solid-beer'; export const view = <button />;", false],
    ["import {Button} from 'solid-beer'; export const view = <Button {...settings} />;", false],
  ])('classifies static library dependencies: %s', async (source, available) => {
    const result = await compileSolidBeer(source, '/fixture/view.tsx', { importSources: ['solid-beer', 'src'] });
    expect(result.report.nativeAvailable).toBe(available);
  });
});

describe('Composed component compiler', () => {
  it('lowers Button/Badge typed params with shared helper warnings and precedence', async () => {
    const result = await lower(
      'import {Button, Badge} from "solid-beer"; export const example = <Button class="large primary" size="small" shape="circle" border><Badge class="min" dot={false} inline>0</Badge></Button>;',
    );
    expect(result.reports[0]?.transformed).toBe(2); // One Button + its Badge.
    expect(result.code).toContain('class="primary circle small border"');
    expect(result.code).toContain('class="badge none"');
    expect(result.warnings.join(' ')).toContain('size');
    expect(result.warnings.join(' ')).toContain('dot');
    expect(result.code).not.toContain('solid-beer');
  });
  it('lowers Badge/Button children and preserves native attributes', async () => {
    const result = await lower(
      'import {Badge, Button} from "solid-beer"; export const example = <><a href="#test"><i>home</i><Badge class="min" /></a><Button class="primary" disabled={disabled()} onClick={clicked}><span>Save</span><Badge class="none">{0}</Badge></Button></>;',
    );
    expect(result.reports[0]?.transformed).toBe(3); // Button + two standalone badges.
    expect(result.code).toContain('<a href="#test">');
    expect(result.code).toContain('class="badge min"');
    expect(result.code).toContain('class="badge none"');
    expect(result.code).toContain('disabled={disabled()}');
    expect(result.code).toContain('onClick={clicked}');
    expect(result.code).not.toContain('solid-beer');
  });

  it.each(['<Badge classList={classes()} />', '<Button {...props}>Save</Button>'])(
    'keeps unsupported composed calls: %s',
    async jsx => {
      const result = await lower(`import {Badge, Button} from "solid-beer"; export const example = ${jsx};`);
      expect(result.output).toBeNull();
      expect(Object.values(result.reports[0]!.fallbacks).reduce((sum, count) => sum + count!, 0)).toBe(1); // One candidate refused by one guard.
    },
  );

  it('preserves escaped text, nested label elements and shadowed bindings', async () => {
    const result = await lower(
      'import {Button as Action} from "solid-beer"; export const example = <Action><strong>A &amp; B</strong>{" <Save> "}</Action>; export function local(Action) { return <Action>Local</Action>; }',
    );
    expect(result.reports[0]?.transformed).toBe(1); // Shadowed Action is not the library component.
    expect(result.code).toContain('<strong>A &amp; B</strong>');
    expect(result.code).toContain('" <Save> "');
    expect(result.code).toContain('<Action>Local</Action>');
  });

  it('keeps empty hosts and rejects invalid literal classes', async () => {
    const result = await lower('import {Button} from "solid-beer"; export const example = <Button />;');
    expect(result.code).toContain('<button class="" />');
    await expect(
      lower('import {Badge} from "solid-beer"; export const example = <Badge class={true} />;'),
    ).rejects.toThrow('Invalid class');
  });

  it('eliminates composed wrappers through the production Vite pipeline', async () => {
    const reports: SolidBeerTransformReport[] = [];
    const result = await viteBuild({
      configFile: false,
      logLevel: 'silent',
      plugins: [solidBeer({ onReport: report => reports.push(report) }), solidPlugin({ hot: false })],
      build: {
        write: false,
        minify: false,
        lib: { entry: 'test/fixtures/compiled-badge.tsx', formats: ['es'] },
        rollupOptions: { external: ['solid-js', 'solid-js/web'] },
      },
    });
    expect(reports.find(report => report.id.endsWith('compiled-badge.tsx'))?.transformed).toBe(5); // Three badges + two buttons, including reactive children.
    const outputs = Array.isArray(result) ? result : [result];
    const code = outputs
      .flatMap(output => ('output' in output ? output.output : []))
      .map(chunk => (chunk.type === 'chunk' ? chunk.code : ''))
      .join('\n');
    expect(code).toContain('badge none');
    expect(code).not.toMatch(/splitProps|createComponent/);
  });
});

describe('BeerCSS primitive compiler', () => {
  it('preserves directional layout classes without appearance recommendations', async () => {
    const result = await lower(
      'import {Card, List, Tabs, Navigation} from "solid-beer"; export const example = <><Card class="vertical-padding top-margin" classList={{ "small-padding": enabled() }} /><List class="medium-space" /><Tabs class="center-align" /><Navigation class="wrap" /></>;',
    );
    expect(result.reports[0]?.fallbacks).toEqual({});
    expect(result.warnings).toEqual([]);
    expect(result.code).toContain('vertical-padding');
    expect(result.code).toContain('top-margin');
    expect(result.code).toContain('small-padding');
    expect(result.code).not.toContain('solid-beer');
  });
  it('lowers typed wrappers and retains arbitrary dynamic classes in a production Vite consumer', async () => {
    const reports: SolidBeerTransformReport[] = [];
    const result = await viteBuild({
      configFile: false,
      logLevel: 'silent',
      plugins: [
        solidBeer({ warnClassHelpers: false, onReport: report => reports.push(report) }),
        solidPlugin({ hot: false }),
      ],
      build: {
        write: false,
        minify: false,
        lib: { entry: 'test/fixtures/compiled-dynamic.tsx', formats: ['es'] },
        rollupOptions: { external: ['solid-js', 'solid-js/web'] },
      },
    });
    const report = reports.find(entry => entry.id.endsWith('compiled-dynamic.tsx'))!;
    expect(report.fallbacks).toEqual({ 'dynamic-appearance': 2 }); // Arbitrary Button and Badge classes retain runtime hosts.
    expect(report.retained).toEqual(['Button', 'Badge']);
    expect(report.transformed).toBe(7); // Three typed hosts + four fixed-key classList hosts.
    const outputs = Array.isArray(result) ? result : [result];
    const code = outputs
      .flatMap(output => ('output' in output ? output.output : []))
      .map(chunk => (chunk.type === 'chunk' ? chunk.code : ''))
      .join('\n');
    expect(code).not.toContain('progressClass');
  });

  it('compiles every primitive recipe and removes the runtime registry from production output', async () => {
    const reports: SolidBeerTransformReport[] = [];
    const result = await viteBuild({
      configFile: false,
      logLevel: 'silent',
      plugins: [solidBeer({ onReport: report => reports.push(report) }), solidPlugin({ hot: false })],
      build: {
        write: false,
        minify: false,
        lib: { entry: 'test/fixtures/compiled-primitives.tsx', formats: ['es'] },
        rollupOptions: { external: ['solid-js', 'solid-js/web'] },
      },
    });
    const report = reports.find(entry => entry.id.endsWith('compiled-primitives.tsx'))!;
    expect(report.fallbacks).toEqual({});
    // Fixture covers all 21 primitive recipes once, including nested Tab and Badge.
    expect(report.transformed).toBe(21);
    const outputs = Array.isArray(result) ? result : [result];
    const code = outputs
      .flatMap(output => ('output' in output ? output.output : []))
      .map(chunk => (chunk.type === 'chunk' ? chunk.code : ''))
      .join('\n');
    expect(code).toContain('large-padding');
    expect(code).toContain('checkbox small');
    expect(code).not.toMatch(/beerClass|beerRecipes|splitProps|createComponent|Dynamic/);
  });

  it('warns on helper classes, rejects invalid literals and lowers dynamic typed appearance', async () => {
    const source =
      'import {Card} from "solid-beer"; export const example = <Card class="border small-padding small-elevate" border={false} elevation="large">{content()}</Card>;';
    const compiled = await lower(source);
    expect(compiled.code).toContain('class="small-padding large-elevate"');
    expect(compiled.code).toContain('{content()}');
    expect(compiled.warnings.join(' ')).toContain('prefer the "elevation" prop');
    expect(compiled.warnings.join(' ')).not.toContain('helper "small-padding"');
    await expect(
      lower('import {Card} from "solid-beer"; export const example = <Card elevation="huge" />;'),
    ).rejects.toThrow('Invalid elevation');
    const dynamic = await lower('import {Card} from "solid-beer"; export const example = <Card border={enabled()} />;');
    expect(dynamic.reports[0]?.fallbacks).toEqual({});
    expect(dynamic.code).toContain('<article');
    expect(dynamic.code).toContain('enabled()');
    expect(dynamic.code).not.toContain('solid-beer');
  });
});

describe('Progress compiler', () => {
  it('removes the imported wrapper and its helpers from a production consumer bundle', async () => {
    const result = await lower(
      `${importProgress} export const Example = () => <Progress shape="circle" wavy size="small" value={done()} max={total()} />;`,
    );
    expect(result.reports[0]?.transformed).toBe(1); // Fixture contains one eligible component.
    expect(result.code).toContain('class="circle wavy small"');
    expect(result.code).toContain('attr:value={done()}');
    expect(result.code).toContain('attr:max={total()}');
    expect(result.code).not.toContain('solid-beer');
    expect(result.output?.map).toBeTruthy();
    const compiled = await transformAsync(result.code, {
      filename: 'example.tsx',
      configFile: false,
      babelrc: false,
      presets: [['babel-preset-solid', { generate: 'dom', dev: false }]],
    });
    const bundle = await build({
      stdin: { contents: compiled!.code!, resolveDir: process.cwd() },
      bundle: true,
      write: false,
      minify: true,
      platform: 'browser',
      conditions: ['browser', 'solid'],
    });
    const code = bundle.outputFiles[0]!.text;
    expect(code).toContain('circle wavy small');
    expect(code).not.toMatch(/splitProps|progressClass|Object\.entries|\.split\(/);
  });

  it('respects import aliases, scope shadowing, other packages and runtime references', async () => {
    const result = await lower(`import { Progress as Indicator } from "solid-beer";
      export const compiled = <Indicator shape="circle" />;
      export const kept = Indicator;
      export function shadow(Indicator) { return <Indicator shape="circle" />; }`);
    expect(result.reports[0]?.transformed).toBe(1); // Only the imported, unshadowed JSX call is eligible.
    expect(result.code).toContain('<progress');
    expect(result.code).toContain('<Indicator');
    expect(result.code).toContain('Progress as Indicator');
    const unrelated = await lower('import { Progress } from "another-package"; export const example = <Progress />;');
    expect(unrelated.output).toBeNull();
    const namespace = await lower('import * as Beer from "solid-beer"; export const example = <Beer.Progress />;');
    expect(namespace.output).toBeNull();
  });

  it.each([
    ['spread', '<Progress {...props} />'],
    ['dynamic-appearance', '<Progress class={classes()} />'],
    ['class-list', '<Progress classList={classes()} />'],
    ['class-list', '<Progress classList={{ [name()]: loading() }} />'],
    ['class-list', '<Progress classList={{ ...classes() }} />'],
    ['class-list', '<Progress classList={{ get wavy() { return loading(); } }} />'],
    ['class-list', '<Progress classList={{ wavy: first(), wavy: second() }} />'],
    ['class-list', '<Progress classList={{ __proto__: state() }} />'],
    ['children', '<Progress>Loading</Progress>'],
    ['unsupported-prop', '<Progress children={label()} />'],
    ['unsupported-prop', '<Progress attr:value={done()} />'],
    ['unsupported-prop', '<Progress className="circle" />'],
    ['duplicate-prop', '<Progress value={first()} value={second()} />'],
  ] as const)('retains %s calls without evaluating user expressions', async (reason, jsx) => {
    const result = await lower(`${importProgress} export const example = ${jsx};`);
    expect(result.output).toBeNull();
    expect(result.reports[0]?.fallbacks).toEqual({ [reason]: 1 }); // Each fixture has one refused JSX call.
  });

  it('uses runtime class precedence, warns on static helpers and can silence warnings', async () => {
    const source = `${importProgress} export const example = <Progress class="circle wavy small large margin" shape="linear" wavy={false} size="medium" />;`;
    const result = await lower(source);
    expect(result.code).toContain('class="margin medium"');
    expect(result.warnings.join('\n')).toContain('class helper "wavy": prefer the "wavy" prop');
    expect(result.warnings).toEqual(result.reports[0]?.warnings);
    expect((await lower(source, { warnClassHelpers: false })).warnings).toEqual([]);
    expect((await lower(`${importProgress} export const example = <Progress class={classes()} />;`)).warnings).toEqual(
      [],
    );
  });

  it('folds literal classList values, warns on known keys and preserves ordinary keys', async () => {
    const result = await lower(
      `${importProgress} export const example = <Progress class="wavy margin" classList={{ wavy: false, circle: true, custom: true }} shape="linear" />;`,
    );
    expect(result.code).toContain('class="margin custom"');
    expect(result.code).not.toContain('classList');
    expect(result.warnings.join('\n')).toContain('classList helper "circle": prefer the "shape" prop');
    expect(result.warnings.join('\n')).not.toContain('helper "custom"');
    const card = await lower(
      'import {Card} from "solid-beer"; export const example = <Card class="border top-padding small-elevate" classList={{ border: false, custom: true }} elevation="large" />;',
    );
    expect(card.code).toContain('class="top-padding custom large-elevate"');
    expect(card.warnings.join('\n')).toContain('classList helper "border"');
    const ordered = await lower(
      'import {Card} from "solid-beer"; export const example = <Card classList={{ "1 custom": false, "1": true }} />;',
    );
    expect(ordered.code).toContain('class=""'); // Object.entries visits integer key 1 first; the later multi-token key removes it.
    expect(
      (
        await lower(`${importProgress} export const example = <Progress classList={{ wavy: enabled() }} />;`, {
          warnClassHelpers: false,
        })
      ).warnings,
    ).toEqual([]);
    const dynamic = await lower(
      `${importProgress} export const example = <Progress classList={{ custom: enabled() }} />;`,
    );
    expect(dynamic.reports[0]?.fallbacks).toEqual({});
    expect(dynamic.warnings).toEqual([]);
    expect(dynamic.code).toContain('<progress');
  });

  it.each(['shape="triangle"', 'size="huge"', 'wavy="yes"'])(
    'rejects invalid static %s with a build diagnostic',
    async attribute => {
      await expect(lower(`${importProgress} export const example = <Progress ${attribute} />;`)).rejects.toThrow(
        'Invalid',
      );
    },
  );

  it('honors source aliases and file filters', async () => {
    const source = 'import { Progress } from "src"; export const example = <Progress />;';
    expect((await lower(source, { importSources: ['src'] })).reports[0]?.transformed).toBe(1); // One opted-in alias call.
    expect((await lower(source)).output).toBeNull();
    expect(
      (await lower(`${importProgress} const example = <Progress />;`, {}, '/node_modules/example.tsx')).reports,
    ).toEqual([]);
    expect((await lower(`${importProgress} const example = <Progress />;`, { include: /other/ })).reports).toEqual([]);
  });

  it('rejects plugin order that would run after the Solid compiler', async () => {
    await expect(resolveConfig({ configFile: false, plugins: [solidPlugin(), solidBeer()] }, 'build')).rejects.toThrow(
      'Place solidBeer() before solidPlugin()',
    );
  });

  it('runs before Solid in a real Vite production build', async () => {
    const reports: SolidBeerTransformReport[] = [];
    const result = await viteBuild({
      configFile: false,
      logLevel: 'silent',
      plugins: [solidBeer({ onReport: report => reports.push(report) }), solidPlugin({ hot: false })],
      build: {
        write: false,
        minify: false,
        lib: { entry: 'test/fixtures/compiled-progress.tsx', formats: ['es'] },
        rollupOptions: { external: ['solid-js', 'solid-js/web'] },
      },
    });
    expect(reports.find(report => report.id.endsWith('compiled-progress.tsx'))?.transformed).toBe(1); // Fixture has one eligible call.
    const outputs = Array.isArray(result) ? result : [result];
    const code = outputs
      .flatMap(output => ('output' in output ? output.output : []))
      .map(chunk => (chunk.type === 'chunk' ? chunk.code : ''))
      .join('\n');
    expect(code).toContain('circle wavy small');
    expect(code).not.toMatch(/createComponent|Indicator|splitProps|progressClass/);
  });

  it('preserves explicit side-effect imports and falls back before validating overridden literals', async () => {
    const result = await lower(`import "solid-beer"; ${importProgress} export const example = <Progress />;`);
    expect(result.code).toContain('import "solid-beer";');
    expect(result.code).not.toContain('{ Progress }');
    const unknown = await lower(`${importProgress} export const example = <Progress shape="unknown" {...props} />;`);
    expect(unknown.output).toBeNull();
    expect(unknown.reports[0]?.fallbacks).toEqual({ spread: 1 }); // Unknown spread can override the literal.
  });
});
