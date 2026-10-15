import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const usage = 'Usage: node scripts/check-template.mjs <library.tgz> [--cli <create-solid-beer.tgz>] [--no-compiler] [--run] [--keep]\nDry-run by default. --run generates a fresh app through create-solid-beer, installs the library archive with Bun, runs the starter build through Node and checks CSS/assets. --cli installs a packed CLI in isolation; otherwise builds the repository CLI first. --no-compiler checks the opt-out starter instead of the default compiler setup. Requires Node + Bun and network/cache access. --keep retains the project. Never installs dependencies into template source.';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}
const cliIndex = args.indexOf('--cli');
const cliArchive = cliIndex === -1 ? undefined : args[cliIndex + 1];
assert.ok(cliIndex === -1 || cliArchive?.endsWith('.tgz'), usage);
const archives = args.filter((arg, index) => !['--run', '--keep', '--no-compiler'].includes(arg) && index !== cliIndex && (cliIndex === -1 || index !== cliIndex + 1));
assert.ok(archives.length === 1 && archives[0].endsWith('.tgz'), usage);
const archive = resolve(archives[0]);
await readFile(archive);
if (cliArchive) await readFile(resolve(cliArchive));
if (!args.includes('--run')) {
  console.log(`Would generate templates/solid-ts ${args.includes('--no-compiler') ? 'without' : 'with'} compiler through ${cliArchive ? resolve(cliArchive) : 'the repository CLI'} against ${archive}. Add --run to install + build.`);
  process.exit(0);
}
const workspace = await mkdtemp(join(tmpdir(), 'solid-beer-template-'));
const project = join(workspace, 'app');
const run = (command, commandArgs, cwd = project) => {
  try {
    execFileSync(command, commandArgs, { cwd, stdio: 'pipe', env: { ...process.env, BUN_INSTALL_CACHE_DIR: join(workspace, 'cache') } });
  } catch (error) {
    throw new Error(`${command} ${commandArgs.join(' ')} failed:\n${error.stdout?.toString() ?? ''}\n${error.stderr?.toString() ?? error.message}`);
  }
};
try {
  const root = fileURLToPath(new URL('../', import.meta.url));
  let cli;
  if (cliArchive) {
    const tool = join(workspace, 'tool');
    await mkdir(tool);
    await writeFile(join(tool, 'package.json'), JSON.stringify({ private: true }));
    run('bun', ['add', `create-solid-beer@file:${resolve(cliArchive).replaceAll('\\', '/')}`], tool);
    cli = join(tool, 'node_modules/create-solid-beer/dist/index.mjs');
  } else {
    run(process.execPath, ['packages/create-solid-beer/scripts/build.mjs'], root);
    cli = join(root, 'packages/create-solid-beer/dist/index.mjs');
  }
  run(process.execPath, [cli, 'app', '--library', archive, '--package-manager', 'bun', ...(args.includes('--no-compiler') ? ['--no-compiler'] : [])], workspace);
  run('bun', ['install']);
  const manifest = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'));
  assert.ok(manifest.dependencies['solid-beer'].startsWith('file:'), 'Starter must use the supplied archive');
  assert.equal(Boolean(manifest.devDependencies['@babel/core']), !args.includes('--no-compiler'), 'Direct Babel dependency must match compiler selection');
  const config = await readFile(join(project, 'vite.config.ts'), 'utf8');
  assert.equal(config.includes('solidBeer()'), !args.includes('--no-compiler'), 'Vite plugin must match compiler selection');
  if (!args.includes('--no-compiler')) {
    const measuredConfig = `import { writeFileSync } from 'node:fs';\n${config.replace('solidBeer()', `solidBeer({ onReport(report) { if (report.id.endsWith('/src/App.tsx')) writeFileSync('compiler-report.json', JSON.stringify(report)); } })`)}`;
    await writeFile(join(project, 'vite.config.ts'), measuredConfig);
  }
  assert.ok((await readFile(join(project, '.gitignore'), 'utf8')).includes('node_modules/'), 'Packed CLI must restore .gitignore');
  for (const dependency of ['tailwindcss', '@tailwindcss/vite']) {
    assert.ok(!manifest.dependencies[dependency] && !manifest.devDependencies[dependency], 'Starter must not require Tailwind');
  }
  run(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit']);
  run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
  if (!args.includes('--no-compiler')) {
    const report = JSON.parse(await readFile(join(project, 'compiler-report.json'), 'utf8'));
    assert.ok(report.transformed > 0, 'Default starter must lower primitives, not merely register the compiler');
  }
  const assets = join(project, 'dist/assets');
  const files = await readdir(assets);
  const css = (await Promise.all(files.filter(file => file.endsWith('.css')).map(file => readFile(join(assets, file), 'utf8')))).join('\n');
  assert.ok(css.includes('@font-face') && css.includes('.collapsible'), 'Starter must include shared + component styles');
  for (const [, reference] of css.matchAll(/url\(([^)]+)\)/g)) {
    const url = reference.trim().replace(/^['"]|['"]$/g, '');
    if (/^(?:data:|https?:|#)/.test(url)) continue;
    const asset = url.startsWith('/') ? resolve(project, 'dist', `.${url}`) : resolve(assets, url);
    await readFile(asset);
  }
  console.log(`create-solid-beer${cliArchive ? ' (packed CLI)' : ''}, compiler=${!args.includes('--no-compiler')}: generated starter + fresh tarball install + strict types + Node production build + CSS/assets passed`);
} finally {
  if (args.includes('--keep')) console.log(`Starter project: ${workspace}`);
  else {
    assert.equal(dirname(resolve(workspace)), resolve(tmpdir()), 'Refusing cleanup outside temp root');
    await rm(workspace, { recursive: true, force: true });
  }
}
