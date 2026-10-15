import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir, rm } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformAsync } from '@babel/core';
import { build as esbuild } from 'esbuild';
import solid from 'babel-preset-solid';
import typescript from '@babel/preset-typescript';
import { build as tsup } from 'tsup';
import { build as vite } from 'vite';

const usage = 'Usage: node scripts/build.mjs\nReplaces repository dist/ with ESM/JSX modules, declarations, runtime/compiler entries and compiled CSS/assets. Requires installed dev dependencies. No consumer Tailwind build is required.';
if (process.argv.includes('--help')) {
  console.log(usage);
  process.exit(0);
}
if (process.argv.length > 2) {
  console.error(usage);
  process.exit(1);
}
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const sourceDir = resolve(root, 'src');
const outDir = resolve(root, 'dist');
const sources = (await readdir(sourceDir, { recursive: true })).map(file => String(file).replaceAll('\\', '/'));
const modules = sources.filter(file => /\.[tj]sx?$/.test(file) && !file.endsWith('.d.ts') && !file.startsWith('compiler/') && !['vite.ts', 'runtime.ts'].includes(file));

// Explicit extensions + directory indexes keep each output variant valid ESM without a resolver.
const importExtensions = extension => ({
  visitor: {
    'ImportDeclaration|ExportNamedDeclaration|ExportAllDeclaration'(path, state) {
      const source = path.node.source;
      if (!source?.value.startsWith('.') || source.value.endsWith('.css')) return;
      const target = resolve(dirname(state.filename), source.value);
      const file = ['.ts', '.tsx', '/index.ts', '/index.tsx'].map(suffix => target + suffix).find(existsSync);
      assert.ok(file, `Unresolved module: ${state.filename} -> ${source.value}`);
      let specifier = relative(dirname(state.filename), file).replaceAll('\\', '/').replace(/\.[tj]sx?$/, extension);
      if (!specifier.startsWith('.')) specifier = './' + specifier;
      source.value = specifier;
    },
  },
});

// Build-owned output only; never clean a computed target outside this repository.
assert.equal(dirname(outDir), resolve(root));
await rm(outDir, { recursive: true, force: true });
for (const variant of [
  { extension: '.js', jsx: false, dev: false },
  { extension: '.dev.js', jsx: false, dev: true },
  { extension: '.jsx', jsx: true, dev: false },
  { extension: '.dev.jsx', jsx: true, dev: true },
]) {
  const rewrite = importExtensions(variant.extension);
  await esbuild({
    entryPoints: modules.map(file => resolve(sourceDir, file)),
    outbase: sourceDir,
    outdir: outDir,
    outExtension: { '.js': variant.extension },
    bundle: false,
    format: 'esm',
    target: 'esnext',
    jsx: 'preserve',
    sourcemap: true,
    define: { 'process.env.NODE_ENV': JSON.stringify(variant.dev ? 'development' : 'production') },
    plugins: [
      {
        name: 'module-imports',
        setup(build) {
          build.onLoad({ filter: /\.tsx?$/ }, async args => {
            const result = await transformAsync(await readFile(args.path, 'utf8'), {
              filename: args.path, configFile: false, babelrc: false, sourceMaps: 'inline',
              presets: [
                ...variant.jsx ? [] : [[solid, { generate: 'dom', dev: variant.dev }]],
                [typescript, { allExtensions: true, isTSX: args.path.endsWith('.tsx') }],
              ],
              plugins: [rewrite],
            });
            return { contents: result.code, loader: variant.jsx ? 'jsx' : 'js' };
          });
        },
      },
    ],
  });
}
await tsup({ entry: { runtime: 'src/runtime.ts', vite: 'src/vite.ts' }, outDir, format: 'esm', target: 'esnext', dts: true, sourcemap: true });
await tsup({ entry: { index: 'src/index.tsx' }, outDir, format: 'esm', dts: { only: true } });
await vite({ configFile: resolve(root, 'vite.styles.config.ts') });

// Missing CSS import targets fail the package build, before a consumer can receive unstyled components.
for (const file of modules) {
  const code = await readFile(resolve(outDir, file.replace(/\.[tj]sx?$/, '.js')), 'utf8');
  for (const [, css] of code.matchAll(/import\s+["']([^"']+\.css)["']/g)) {
    assert.ok(existsSync(resolve(outDir, dirname(file), css)), `Missing compiled CSS: ${file} -> ${css}`);
  }
}

// Consumers may load any published sheet first; each must name every src/layers.css layer, in order, itself.
// Other layers (Tailwind's leading `properties`) may interleave: only the relative first-appearance order counts.
const layerNames = css => [...new Set([...css.matchAll(/@layer\s*([^{;]+)[{;]/g)].flatMap(([, names]) => names.split(',').map(name => name.trim())))];
const layerOrder = layerNames(await readFile(resolve(sourceDir, 'layers.css'), 'utf8'));
const sheets = (await readdir(outDir, { recursive: true })).map(String).filter(file => file.endsWith('.css'));
for (const sheet of sheets) {
  const names = layerNames(await readFile(resolve(outDir, sheet), 'utf8')).filter(name => layerOrder.includes(name));
  assert.deepEqual(names, layerOrder, `Sheet does not fix layer order (import layers.css first): ${sheet}`);
}
console.log(`Built ${modules.length} ESM modules per variant + compiled component CSS; CSS imports preserved.`);
