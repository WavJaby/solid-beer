#!/usr/bin/env node
import { constants } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const usage = `Usage: create-solid-beer [directory] [options]

Creates a Solid + TypeScript + Vite app. Default directory: my-app.
Configures the compiler by default; use --no-compiler to omit it.
Accepts a new or empty directory, including ".". Never overwrites existing files.
Does not install dependencies or initialize Git.

Options:
  --package-manager <npm|bun>  Printed install/dev commands; detected from the runner, otherwise npm
  --library <version|archive.tgz>  Override solid-beer with an exact version or local tarball
  --no-compiler              Omit the library compiler plugin and direct Babel dependency
  --help                     Show usage
  --version                  Show CLI version

Examples:
  npm create solid-beer@latest my-app
  bunx create-solid-beer@latest my-app
  node dist/index.mjs my-app --library /absolute/path/solid-beer-0.0.0.tgz`;
const MAX_PACKAGE_NAME_LENGTH = 214; // npm package-name limit.
const template = fileURLToPath(new URL('./template/', import.meta.url));
const quotePath = value => process.platform === 'win32'
  ? `'${value.replaceAll("'", "''")}'`
  : `'${value.replaceAll("'", "'\\''")}'`;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(usage);
    return;
  }
  if (args.includes('--version')) {
    console.log(JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).version);
    return;
  }
  let directory;
  let manager = process.env.npm_config_user_agent?.startsWith('bun/') || process.versions.bun ? 'bun' : 'npm';
  let library;
  let noCompiler = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--') continue;
    if (arg === '--no-compiler') {
      noCompiler = true;
    } else if (arg === '--package-manager' || arg === '--library') {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}.`);
      if (arg === '--package-manager') manager = value;
      else library = value;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}. Run with --help.`);
    } else if (directory === undefined) {
      directory = arg;
    } else {
      throw new Error('Expected one project directory. Run with --help.');
    }
  }
  if (!['npm', 'bun'].includes(manager)) throw new Error('Package manager must be npm or bun.');
  const target = resolve(directory ?? 'my-app');
  const name = basename(target).toLowerCase().replace(/\s+/g, '-');
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name) || name.length > MAX_PACKAGE_NAME_LENGTH || ['node_modules', 'favicon.ico'].includes(name)) {
    throw new Error('Choose a directory name that forms a valid npm package name: letters, digits, dots, hyphens or underscores.');
  }
  let targetStat;
  try {
    targetStat = await lstat(target);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (targetStat && (!targetStat.isDirectory() || (await readdir(target)).length)) {
    throw new Error(`Destination must be a new or empty directory: ${target}`);
  }
  const manifest = JSON.parse(await readFile(join(template, 'package.json'), 'utf8'));
  manifest.name = name;
  if (noCompiler) delete manifest.devDependencies['@babel/core'];
  if (library) {
    if (/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(library)) {
      manifest.dependencies['solid-beer'] = library;
    } else if (library.endsWith('.tgz')) {
      const archive = resolve(library);
      if (!(await lstat(archive)).isFile()) throw new Error('Library archive must be a regular .tgz file.');
      manifest.dependencies['solid-beer'] = `file:${archive.replaceAll('\\', '/')}`;
    } else {
      throw new Error('--library requires an exact version or a local .tgz archive.');
    }
  }
  await mkdir(target, { recursive: true });
  async function copyDirectory(source, destination) {
    for (const entry of await readdir(source, { withFileTypes: true })) {
      if (entry.name === 'package.json' && source === template) continue;
      const output = join(destination, entry.name === '_gitignore' ? '.gitignore' : entry.name);
      if (entry.isDirectory()) {
        await mkdir(output);
        await copyDirectory(join(source, entry.name), output);
      } else if (noCompiler && source === template && entry.name === 'vite.config.ts') {
        const config = (await readFile(join(source, entry.name), 'utf8'))
          .replace(/^import solidBeer from 'solid-beer\/vite';\r?\n/m, '')
          .replace('solidBeer(), ', '');
        await writeFile(output, config, { flag: 'wx' });
      } else {
        await copyFile(join(source, entry.name), output, constants.COPYFILE_EXCL);
      }
    }
  }
  await copyDirectory(template, target);
  await writeFile(join(target, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  console.log(`Created ${name} in ${target}\n\nNext:\n  cd ${quotePath(target)}\n  ${manager} install\n  ${manager} run dev`);
}

try {
  await main();
} catch (error) {
  console.error(`create-solid-beer: ${error.message}`);
  process.exitCode = 1;
}
