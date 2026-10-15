import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const usage = 'Usage: node scripts/check-docs.mjs\nRead-only. Checks README/INSTALL separation, public Markdown links/anchors, JSON snippets, code fences and guide packaging. No network requests.';
if (process.argv.includes('--help')) {
  console.log(usage);
  process.exit(0);
}
assert.equal(process.argv.length, 2, usage);
const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(file, 'utf8');
const prose = text => text.replace(/```[\s\S]*?```/g, '');
const headings = text => [...prose(text).matchAll(/^#{1,6} (.+)$/gm)].map(([, heading]) => heading.trim());
const anchor = heading => heading.toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replaceAll(' ', '-');
const readme = read(resolve(root, 'README.md'));
const installationHeading = /install|setup|requirements|compatibility|tailwind|configur|hosting|contribut|new project|existing project|SSR|Vite compiler|disable.*compiler/i;
assert.ok(headings(readme).every(heading => !installationHeading.test(heading)), 'README must contain usage/examples; installation/configuration belongs in INSTALL.md');
assert.ok(readme.includes('](INSTALL.md)'), 'README must link to the installation guide');
const files = ['README.md', 'INSTALL.md', 'API.md', 'packages/create-solid-beer/README.md', 'templates/solid-ts/README.md'];
for (const relative of files) {
  const file = resolve(root, relative);
  const text = read(file);
  const anchors = headings(text).map(anchor);
  assert.equal(new Set(anchors).size, anchors.length, `${relative}: duplicate heading anchors`);
  assert.equal((text.match(/^```/gm) ?? []).length % 2, 0, `${relative}: unbalanced code fences`);
  for (const [, json] of text.matchAll(/```json\r?\n([\s\S]*?)\r?\n```/g)) JSON.parse(json);
  for (const [, link] of prose(text).matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|mailto:)/.test(link)) continue;
    const [path, fragment] = link.split('#');
    const target = path ? resolve(dirname(file), path) : file;
    assert.ok(existsSync(target), `${relative}: missing link target ${link}`);
    if (fragment && target.endsWith('.md')) {
      assert.ok(headings(read(target)).map(anchor).includes(fragment), `${relative}: missing anchor ${link}`);
    }
  }
}
assert.ok(JSON.parse(read(resolve(root, 'package.json'))).files.includes('INSTALL.md'), 'npm archive must include INSTALL.md');
assert.ok(JSON.parse(read(resolve(root, 'package.json'))).files.includes('API.md'), 'npm archive must include API.md');
console.log('README/INSTALL separation + links/anchors + JSON/fences + public-guide packaging passed');
