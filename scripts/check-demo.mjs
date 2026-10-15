import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';

const usage = 'Usage: node scripts/check-demo.mjs [--base /path/] [--run] [--keep]\nDry-run by default. --run builds the demo into an isolated temp directory and checks HTML, asset links, CSS URLs and every emitted file over loopback HTTP. --base defaults to /; use the Pages project path for subdirectory hosting. Requires installed development dependencies; no deployment or browser automation. --keep retains build output.';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}
const baseIndex = args.indexOf('--base');
const base = baseIndex === -1 ? '/' : args[baseIndex + 1];
assert.ok(typeof base === 'string' && /^\/(?:[A-Za-z0-9._~-]+\/)*$/.test(base), usage);
assert.ok(args.every((arg, index) => ['--base', '--run', '--keep'].includes(arg) || index === baseIndex + 1 && baseIndex !== -1), usage);
if (!args.includes('--run')) {
  console.log(`Would build + HTTP-check demo at ${base}. Add --run to execute.`);
  process.exit(0);
}
const repository = fileURLToPath(new URL('../', import.meta.url));
const workspace = await mkdtemp(join(tmpdir(), 'solid-beer-demo-'));
const outDir = join(workspace, 'dist');
let server;
try {
  const config = {
    configFile: join(repository, 'dev/vite.config.ts'),
    root: join(repository, 'dev'),
    base,
    build: { outDir, emptyOutDir: true },
    logLevel: 'error',
  };
  const bundles = await build(config);
  const outputs = [bundles].flat().flatMap(bundle => bundle.output);
  assert.ok(outputs.some(output => output.type === 'chunk' && Object.entries(output.modules).some(([id, module]) =>
    id.replaceAll('\\', '/').endsWith('/beercss/dist/cdn/beer.min.js') && module.renderedLength > 0,
  )), 'Demo bundle must retain the BeerCSS runtime; auto theme and native interactions depend on initialization');
  server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0, open: false } });
  const address = server.httpServer.address();
  assert.ok(address && typeof address !== 'string', 'Preview must listen on a TCP port');
  const origin = `http://127.0.0.1:${address.port}`;
  const checked = new Set();
  async function check(url) {
    assert.equal(url.origin, origin, 'Asset must stay on the preview origin');
    assert.ok(url.pathname.startsWith(base), `Asset escapes hosting base: ${url.pathname}`);
    if (checked.has(url.href)) return;
    const response = await fetch(url);
    assert.equal(response.status, 200, `Failed HTTP response: ${url.pathname}`);
    const body = Buffer.from(await response.arrayBuffer());
    assert.ok(body.length, `Empty response: ${url.pathname}`);
    if (!url.pathname.endsWith('/') && !url.pathname.endsWith('.html')) {
      assert.ok(!/^\s*<!doctype html/i.test(body.toString('utf8')), `SPA fallback masked a missing asset: ${url.pathname}`);
    }
    checked.add(url.href);
    if (url.pathname.endsWith('.css')) {
      for (const [, reference] of body.toString('utf8').matchAll(/url\(([^)]+)\)/g)) {
        const value = reference.trim().replace(/^['"]|['"]$/g, '');
        if (/^(?:data:|https?:|#)/.test(value)) continue;
        await check(new URL(value, url));
      }
    }
  }
  const page = new URL(base, origin);
  await check(page);
  const html = await readFile(join(outDir, 'index.html'), 'utf8');
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(([, value]) => value);
  assert.ok(references.length, 'Demo HTML must reference built assets');
  for (const reference of references) await check(new URL(reference, page));
  async function checkDirectory(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = `${prefix}${entry.name}`;
      if (entry.isDirectory()) await checkDirectory(join(directory, entry.name), `${relative}/`);
      else await check(new URL(`${base}${relative}`, origin));
    }
  }
  await checkDirectory(outDir);
  await assert.rejects(check(new URL(`${base}missing-asset-probe.js`, origin)), /Failed HTTP response|SPA fallback masked a missing asset/);
  console.log(`Demo ${base}: build + ${checked.size} HTTP page/asset responses + missing-asset rejection passed; no browser interaction measured`);
} finally {
  if (server) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
  if (args.includes('--keep')) console.log(`Demo output: ${outDir}`);
  else {
    assert.equal(dirname(resolve(workspace)), resolve(tmpdir()), 'Refusing cleanup outside temp root');
    await rm(workspace, { recursive: true, force: true });
  }
}
