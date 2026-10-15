import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const usage = 'Usage: node scripts/check-package.mjs <archive.tgz> [--solid <exact-version>] [--vite <exact-version>] [--dev] [--keep]\nInstalls a tarball in a fresh temp project + cache; checks per-component CSS inclusion/exclusion, utilities/assets, lazy imports and SSR with/without the compiler. Version flags pin/assert installed versions and check published component/compiler declarations with strict TypeScript. --dev also checks HTTP development transforms + normal server shutdown; this lifecycle gate can fail independently of production builds. Requires Bun + Node; downloads dependencies. --keep preserves the project for inspection.';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}
const solidIndex = args.indexOf('--solid');
const solidVersion = solidIndex === -1 ? undefined : args[solidIndex + 1];
assert.ok(solidIndex === -1 || /^\d+\.\d+\.\d+$/.test(solidVersion ?? ''), usage);
const viteIndex = args.indexOf('--vite');
const viteVersion = viteIndex === -1 ? undefined : args[viteIndex + 1];
assert.ok(viteIndex === -1 || /^\d+\.\d+\.\d+$/.test(viteVersion ?? ''), usage);
const optionIndices = new Set([solidIndex, viteIndex].filter(index => index !== -1).flatMap(index => [index, index + 1]));
const archiveArgs = args.filter((arg, index) => !['--keep', '--dev'].includes(arg) && !optionIndices.has(index));
if (archiveArgs.length !== 1 || archiveArgs[0].startsWith('-')) {
  console.error(usage);
  process.exit(1);
}
const archive = resolve(archiveArgs[0]);
assert.ok(archive.endsWith('.tgz') && existsSync(archive), `Missing .tgz archive: ${archive}`);
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const workspace = await mkdtemp(join(tmpdir(), 'solid-beer-consumer-'));
const run = (command, args) => {
  try {
    execFileSync(command, args, { cwd: workspace, stdio: 'pipe' });
  } catch (error) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${error.stderr?.toString() || error.stdout?.toString() || error.message}`);
  }
};

try {
  await writeFile(join(workspace, 'package.json'), JSON.stringify({
    private: true,
    type: 'module',
    dependencies: { [pkg.name]: `file:${archive.replaceAll('\\', '/')}`, 'solid-js': solidVersion ?? pkg.peerDependencies['solid-js'] },
    overrides: { ...(solidVersion ? { 'solid-js': solidVersion } : {}), ...(viteVersion ? { vite: viteVersion } : {}) },
    devDependencies: { vite: viteVersion ?? pkg.peerDependencies.vite, 'vite-plugin-solid': pkg.devDependencies['vite-plugin-solid'], '@babel/core': pkg.peerDependencies['@babel/core'], ...((solidVersion || viteVersion) ? { typescript: pkg.devDependencies.typescript, '@types/node': pkg.devDependencies['@types/node'] } : {}) },
  }, null, 2));
  await writeFile(join(workspace, 'index.html'), '<div id="root"></div><script type="module" src="/app.tsx"></script>');
  const config = (compiler, ssr = false, compiled = false) => `import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import solid from 'vite-plugin-solid';
import solidBeer from '${pkg.name}/vite';
export default defineConfig({ plugins: [${compiler ? `solidBeer({ onReport(report) { if (report.id.endsWith('/app.tsx')) writeFileSync('compiler-report.json', JSON.stringify(report)); if (report.id.endsWith('/server.tsx')) writeFileSync('ssr-compiler-report.json', JSON.stringify(report)); } }), ` : ''}solid({ ssr: ${ssr} })], resolve: { alias: ${compiled ? `[{ find: /^${pkg.name}$/, replacement: resolve('node_modules/${pkg.name}/dist/index.js') }]` : '[]'} } });
`;
  const app = (imports, jsx) => `import { render } from 'solid-js/web';
import '${pkg.name}/styles.css';
import '${pkg.name}/runtime';
import { ${imports} } from '${pkg.name}';
render(() => ${jsx}, document.getElementById('root')!);
`;
  run('bun', ['install', '--ignore-scripts', '--cache-dir', join(workspace, 'cache')]);
  if (solidVersion) {
    const installed = JSON.parse(await readFile(join(workspace, 'node_modules/solid-js/package.json'), 'utf8'));
    assert.equal(installed.version, solidVersion, 'Consumer runtime must match requested Solid version');
  }
  if (viteVersion) {
    const installed = JSON.parse(await readFile(join(workspace, 'node_modules/vite/package.json'), 'utf8'));
    assert.equal(installed.version, viteVersion, 'Consumer Vite must match requested version');
  }
  if (solidVersion || viteVersion) {
    await writeFile(join(workspace, 'types.ts'), `export * from '${pkg.name}';\nimport solidBeer from '${pkg.name}/vite';\nimport { defineConfig } from 'vite';\nexport default defineConfig({ plugins: [solidBeer()] });\n`);
    run(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--moduleResolution', 'bundler', '--module', 'esnext', '--target', 'esnext', '--types', 'solid-js,node', 'types.ts']);
  }
  assert.ok(!existsSync(join(workspace, 'node_modules/tailwindcss')), 'Consumer must not install Tailwind');
  assert.ok(!existsSync(join(workspace, 'node_modules/@tailwindcss')), 'Consumer must not install Tailwind plugins');
  const selectors = ['.account-menu', '.solid-beer-menu-validation', '.image-manager-upload', '.collapsible', '.user-link', '.tw\\:relative', '.tw\\:overflow-x-auto', '.tw\\:cursor-pointer'];
  const cases = [
    { name: 'Button', imports: 'Button, Progress', jsx: '<><Button border>Button</Button><Progress shape="circle" wavy /></>', present: [] },
    { name: 'Collapsible', imports: 'Collapsible', jsx: '<Collapsible title="Details"><p>Content</p></Collapsible>', present: ['.collapsible', '.tw\\:cursor-pointer'] },
    { name: 'ImageManager', imports: 'ImageManager', jsx: '<ImageManager imageUrls={[]} />', present: ['.image-manager-upload', '.tw\\:overflow-x-auto', '.tw\\:cursor-pointer'] },
    { name: 'AccountMenu', imports: 'AccountMenu', jsx: '<AccountMenu user={{ username: "Alex" }} />', present: ['.account-menu'] },
    { name: 'MenuSelect', imports: 'MenuSelect', jsx: '<MenuSelect options={[]} onSelect={() => {}} />', present: ['.solid-beer-menu-validation'] },
    { name: 'UserLink', imports: 'UserLink', jsx: '<UserLink userId="alex" loadUser={async () => null} />', present: ['.user-link'] },
    { name: 'Dialog', imports: 'Dialog', jsx: '<Dialog show>Content</Dialog>', present: ['.tw\\:relative'] },
    { name: 'unused import', imports: 'AccountMenu', jsx: '<p>Native</p>', present: [] },
  ];
  const readAssets = async () => {
    const assetDir = join(workspace, 'dist/assets');
    const files = await readdir(assetDir);
    const css = await Promise.all(files.filter(file => file.endsWith('.css')).map(file => readFile(join(assetDir, file), 'utf8')));
    assert.ok(css.length, 'Consumer emitted no shared CSS');
    const combined = css.join('\n');
    assert.ok(!/@(?:import|source|tailwind|reference)\b/.test(combined), 'Consumer received uncompiled CSS');
    assert.ok(!combined.includes('.tw\\:pr-12'), 'Demo-only utility leaked into package');
    for (const [, reference] of combined.matchAll(/url\(([^)]+)\)/g)) {
      const url = reference.trim().replace(/^['"]|['"]$/g, '');
      if (/^(?:data:|https?:|#)/.test(url)) continue;
      const asset = url.startsWith('/') ? resolve(workspace, 'dist', `.${url}`) : resolve(assetDir, url);
      assert.ok(existsSync(asset), `Missing packaged CSS asset: ${url}`);
    }
    return { css, combined };
  };
  for (const compiler of [false, true]) {
    await writeFile(join(workspace, 'vite.config.ts'), config(compiler));
    if (args.includes('--dev')) {
      await writeFile(join(workspace, 'app.tsx'), app('Button', '<Button border>Development probe</Button>'));
      run(process.execPath, ['--input-type=module', '-e', `import assert from 'node:assert/strict'; const { createServer } = await import('vite'); const server = await createServer({ server: { host: '127.0.0.1', port: 0 } }); try { await server.listen(); const port = server.httpServer.address().port; const response = await fetch('http://127.0.0.1:' + port + '/app.tsx'); assert.equal(response.status, 200); assert.ok((await response.text()).includes('Development probe')); await server.waitForRequestsIdle(); } finally { await server.close(); }`]);
    }
    for (const test of cases) {
      await writeFile(join(workspace, 'app.tsx'), app(test.imports, test.jsx));
      run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
      if (compiler && test.name === 'Button') {
        const report = JSON.parse(await readFile(join(workspace, 'compiler-report.json'), 'utf8'));
        assert.equal(report.transformed, test.imports.split(',').length, 'Compiler must lower every primitive in the Button/Progress fixture');
      }
      const { combined } = await readAssets();
      for (const selector of selectors) {
        assert.equal(combined.includes(selector), test.present.includes(selector), `${test.name}, compiler=${compiler}: ${selector}`);
      }
    }
    await writeFile(join(workspace, 'app.tsx'), app('Button', '<Button onClick={async () => { const { ImageManager } = await import("' + pkg.name + '"); render(() => <ImageManager imageUrls={[]} />, document.getElementById("root")!); }}>Load</Button>'));
    run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
    const barrelAssets = await readAssets();
    assert.ok(barrelAssets.combined.includes('.image-manager-upload'), 'Dynamic barrel import must retain component CSS');
    // A statically imported barrel may be coalesced; a distinct application module owns the lazy boundary.
    await writeFile(join(workspace, 'image-panel.tsx'), `import { ImageManager } from '${pkg.name}';\nexport default function ImagePanel() { return <ImageManager imageUrls={[]} />; }\n`);
    await writeFile(join(workspace, 'app.tsx'), app('Button', '<Button onClick={async () => { const { default: ImagePanel } = await import("./image-panel"); render(() => <ImagePanel />, document.getElementById("root")!); }}>Load</Button>'));
    run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
    const { css } = await readAssets();
    assert.ok(css.some(sheet => sheet.includes('.image-manager-upload') && !sheet.includes('@font-face')), 'Lazy component CSS must be separate from the shared stylesheet');
    const html = await readFile(join(workspace, 'dist/index.html'), 'utf8');
    const initialSheets = [...html.matchAll(/href="([^"]+\.css)"/g)].map(([, href]) => resolve(workspace, 'dist', href.replace(/^\/+/, '')));
    assert.ok(initialSheets.length, 'Initial HTML must load shared CSS');
    for (const sheet of initialSheets) {
      assert.ok(!(await readFile(sheet, 'utf8')).includes('.image-manager-upload'), 'Lazy component CSS must stay out of initial HTML stylesheets');
    }
    await writeFile(join(workspace, 'vite.config.ts'), config(compiler, true));
    await writeFile(join(workspace, 'server.tsx'), `import { renderToString } from 'solid-js/web';
import { Button, Progress, Collapsible } from '${pkg.name}';
export const html = renderToString(() => <><Button border>SSR action</Button><Progress shape="circle" /><Collapsible title="SSR">Server content</Collapsible></>);
`);
    run(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--ssr', 'server.tsx', '--outDir', 'server-dist']);
    if (compiler) {
      const report = JSON.parse(await readFile(join(workspace, 'ssr-compiler-report.json'), 'utf8'));
      assert.equal(report.transformed, 2, 'SSR fixture must lower Button + Progress');
    }
    run(process.execPath, ['--input-type=module', '-e', 'const { html } = await import("./server-dist/server.js"); if (!html.includes("Server content") || !html.includes("SSR action") || !html.includes("<progress") || /\\s(?:shape|border)=/.test(html)) throw Error("Invalid SSR component/primitive output");']);
    await writeFile(join(workspace, 'vite.config.ts'), config(compiler, false, true));
    for (const test of cases.filter(test => ['Button', 'Collapsible'].includes(test.name))) {
      await writeFile(join(workspace, 'app.tsx'), app(test.imports, test.jsx));
      run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
      const { combined } = await readAssets();
      for (const selector of selectors) {
        assert.equal(combined.includes(selector), test.present.includes(selector), `Compiled JS ${test.name}, compiler=${compiler}: ${selector}`);
      }
    }
  }
  console.log(`${pkg.name}${viteVersion ? ` / Vite ${viteVersion}` : ''}${solidVersion ? ` / Solid ${solidVersion}` : ''}: ${cases.length} single-component/unused cases + compiler lowering + compiled JS entries + lazy CSS + executed SSR passed with/without compiler${args.includes('--dev') ? ' + HTTP dev transforms/normal shutdown' : ''}; fresh tarball install, assets valid, no Tailwind dependency/plugin`);
} finally {
  if (args.includes('--keep')) console.log(`Consumer project: ${workspace}`);
  else {
    assert.equal(dirname(resolve(workspace)), resolve(tmpdir()), 'Refusing cleanup outside the temp root');
    await rm(workspace, { recursive: true, force: true });
  }
}
