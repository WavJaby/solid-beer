import assert from 'node:assert/strict';
import { chmod, copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const repository = resolve(root, '../..');
const out = join(root, 'dist');
assert.equal(dirname(out), resolve(root), 'Build output must stay in the CLI package');
await rm(out, { recursive: true, force: true });
await mkdir(join(out, 'template'), { recursive: true });
await copyFile(join(root, 'src/index.mjs'), join(out, 'index.mjs'));
await chmod(join(out, 'index.mjs'), 0o755); // Executable npm bin on Unix.
await copyFile(join(repository, 'LICENSE'), join(root, 'LICENSE'));
async function copyTemplate(source, destination) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'bun.lock', 'package-lock.json'].includes(entry.name)) continue;
    const output = join(destination, entry.name === '.gitignore' ? '_gitignore' : entry.name);
    if (entry.isDirectory()) {
      await mkdir(output);
      await copyTemplate(join(source, entry.name), output);
    } else {
      await copyFile(join(source, entry.name), output);
    }
  }
}
await copyTemplate(join(repository, 'templates/solid-ts'), join(out, 'template'));
const manifestPath = join(out, 'template/package.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const library = JSON.parse(await readFile(join(repository, 'package.json'), 'utf8'));
manifest.dependencies['solid-beer'] = library.version;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Built create-solid-beer + solid-ts template for solid-beer ${library.version}`);
