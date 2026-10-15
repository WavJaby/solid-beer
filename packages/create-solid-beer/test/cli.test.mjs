import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { afterEach, test } from 'node:test';

const cli = fileURLToPath(new URL('../dist/index.mjs', import.meta.url));
const workspaces = [];
async function workspace() {
  const path = await mkdtemp(join(tmpdir(), 'create-solid-beer-test-'));
  workspaces.push(path);
  return path;
}
const run = (cwd, args, env = {}) => spawnSync(process.execPath, [cli, ...args], {
  cwd,
  encoding: 'utf8',
  env: { ...process.env, npm_config_user_agent: '', ...env },
});
afterEach(async () => {
  for (const path of workspaces.splice(0)) {
    assert.equal(dirname(resolve(path)), resolve(tmpdir()));
    await rm(path, { recursive: true, force: true });
  }
});

test('creates the default app with public imports, styles/runtime and gitignore', async () => {
  const cwd = await workspace();
  const result = run(cwd, []);
  assert.equal(result.status, 0, result.stderr);
  const target = join(cwd, 'my-app');
  const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
  assert.equal(manifest.name, 'my-app');
  assert.equal(manifest.private, true);
  assert.ok(manifest.devDependencies['@babel/core']);
  const config = await readFile(join(target, 'vite.config.ts'), 'utf8');
  assert.match(config, /import solidBeer from 'solid-beer\/vite'/);
  assert.match(config, /plugins: \[solidBeer\(\), solidPlugin\(\)\]/);
  assert.ok(!manifest.dependencies.tailwindcss && !manifest.devDependencies.tailwindcss);
  assert.match(await readFile(join(target, 'src/index.tsx'), 'utf8'), /solid-beer\/runtime/);
  assert.match(await readFile(join(target, '.gitignore'), 'utf8'), /node_modules/);
  assert.match(result.stdout, /npm install/);
  assert.ok(!(await readdir(target)).includes('node_modules'));
});

test('--no-compiler omits the plugin and direct Babel dependency', async () => {
  const cwd = await workspace();
  const result = run(cwd, ['app', '--no-compiler']);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(await readFile(join(cwd, 'app/package.json'), 'utf8'));
  assert.ok(!manifest.devDependencies['@babel/core']);
  const config = await readFile(join(cwd, 'app/vite.config.ts'), 'utf8');
  assert.doesNotMatch(config, /solidBeer|solid-beer\/vite/);
  assert.match(config, /plugins: \[solidPlugin\(\)\]/);
  assert.match(await readFile(join(cwd, 'app/src/App.tsx'), 'utf8'), /DialogStack/);
});

test('supports empty current directories, package names with spaces and runner detection', async () => {
  const cwd = await workspace();
  const target = join(cwd, 'My App');
  await mkdir(target);
  const result = run(target, ['.'], { npm_config_user_agent: 'bun/1.4.3' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(await readFile(join(target, 'package.json'), 'utf8')).name, 'my-app');
  assert.match(result.stdout, /bun install/);
});

test('supports exact library versions and explicit package managers', async () => {
  const cwd = await workspace();
  const version = '1.2.3'; // Arbitrary exact version: CLI must preserve the requested specifier without querying npm.
  const result = run(cwd, ['app', '--library', version, '--package-manager', 'npm'], { npm_config_user_agent: 'bun/1.4.3' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(await readFile(join(cwd, 'app/package.json'), 'utf8')).dependencies['solid-beer'], version);
  assert.match(result.stdout, /npm install/);
});

test('resolves a local archive from the caller directory, including spaces', async () => {
  const cwd = await workspace();
  const archive = join(cwd, 'local package.tgz');
  await writeFile(archive, 'Archive content is validated by the package manager.');
  const result = run(cwd, ['nested/app', '--library', './local package.tgz']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(await readFile(join(cwd, 'nested/app/package.json'), 'utf8')).dependencies['solid-beer'], `file:${archive.replaceAll('\\', '/')}`);
});

test('refuses existing content, files and directory symlinks without changing them', async () => {
  const cwd = await workspace();
  const occupied = join(cwd, 'occupied');
  await mkdir(occupied);
  await writeFile(join(occupied, 'keep.txt'), 'unchanged');
  await writeFile(join(cwd, 'file'), 'unchanged');
  const empty = join(cwd, 'empty');
  await mkdir(empty);
  await symlink(empty, join(cwd, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  for (const target of ['occupied', 'file', 'linked']) {
    const result = run(cwd, [target]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /new or empty directory/);
  }
  assert.equal(await readFile(join(occupied, 'keep.txt'), 'utf8'), 'unchanged');
  assert.deepEqual(await readdir(occupied), ['keep.txt']);
  assert.equal(await readFile(join(cwd, 'file'), 'utf8'), 'unchanged');
  assert.deepEqual(await readdir(empty), []);
});

test('invalid inputs fail before creating a destination', async () => {
  const cwd = await workspace();
  for (const args of [
    ['app', '--force'],
    ['app', '--package-manager'],
    ['app', '--package-manager', 'yarn'],
    ['app', 'extra'],
    ['@invalid'],
    ['node_modules'],
    ['app', '--library', '^1.0.0'],
    ['app', '--library', 'missing.tgz'],
  ]) {
    const result = run(cwd, args);
    assert.equal(result.status, 1, JSON.stringify(args));
    assert.match(result.stderr, /create-solid-beer:/);
    assert.deepEqual(await readdir(cwd), [], JSON.stringify(args));
  }
});

test('help/version are read-only', async () => {
  const cwd = await workspace();
  assert.match(run(cwd, ['--help']).stdout, /Usage: create-solid-beer/);
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(run(cwd, ['--version']).stdout.trim(), manifest.version);
  assert.deepEqual(await readdir(cwd), []);
});
