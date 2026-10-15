import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const usage = 'Usage: node scripts/check-solid.mjs --versions <exact,versions> [--run] [--types-only] [--keep]\nDry-run by default. --run installs an isolated source snapshot per Solid version; checks types, build, client/SSR tests and a packed consumer. --types-only limits boundary probes to TypeScript. Requires Node + Bun and network/cache access. --keep preserves snapshots and logs; never changes repository dependencies.';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}
const versionIndex = args.indexOf('--versions');
const versions = args[versionIndex + 1]?.split(',');
assert.ok(versionIndex >= 0 && versions?.length && versions.every(version => /^\d+\.\d+\.\d+$/.test(version)), usage);
assert.ok(args.every((arg, index) => ['--versions', '--run', '--types-only', '--keep'].includes(arg) || index === versionIndex + 1), usage);
if (!args.includes('--run')) {
  console.log(`Would check Solid ${versions.join(', ')}: ${args.includes('--types-only') ? 'types' : 'types + build + client/SSR tests + packed consumer'}. Add --run to install and execute.`);
  process.exit(0);
}
const root = fileURLToPath(new URL('../', import.meta.url));
const workspace = await mkdtemp(join(tmpdir(), 'solid-beer-matrix-'));
const results = [];
try {
  for (const version of versions) {
    const project = join(workspace, version);
    const run = (command, commandArgs, stage) => {
      console.log(`Solid ${version}: ${stage}`);
      try {
        const output = execFileSync(command, commandArgs, { cwd: project, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, CI: 'true' } });
        return output;
      } catch (error) {
        throw new Error(`${stage} failed:\n${error.stdout ?? ''}\n${error.stderr ?? error.message}`);
      }
    };
    try {
      for (const entry of ['src', 'dev', 'test', 'scripts', 'package.json', 'bun.lock', 'README.md', 'INSTALL.md', 'API.md', 'tsconfig.json', 'env.d.ts', 'vitest.config.ts', 'vite.styles.config.ts', '.gitignore', '.eslintrc', '.prettierrc', '.editorconfig']) {
        await cp(join(root, entry), join(project, entry), { recursive: true, filter: path => basename(path) !== '.agent' });
      }
      run('bun', ['install', '--frozen-lockfile', '--ignore-scripts'], 'install locked toolchain');
      const manifest = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'));
      manifest.devDependencies['solid-js'] = version;
      manifest.overrides = { ...manifest.overrides, 'solid-js': version };
      await writeFile(join(project, 'package.json'), JSON.stringify(manifest, null, 2));
      run('bun', ['install', '--ignore-scripts'], 'select exact Solid runtime');
      const installed = JSON.parse(await readFile(join(project, 'node_modules/solid-js/package.json'), 'utf8'));
      assert.equal(installed.version, version, 'Runtime version must match requested version');
      run(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit'], 'types');
      if (!args.includes('--types-only')) {
        run(process.execPath, ['scripts/build.mjs'], 'build');
        const client = run(process.execPath, ['node_modules/vitest/vitest.mjs', 'run'], 'client tests');
        const ssr = run(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--mode', 'ssr'], 'SSR tests');
        console.log([...client.matchAll(/Tests\s+[^\n]+/g), ...ssr.matchAll(/Tests\s+[^\n]+/g)].map(match => match[0]).join('; '));
        run('bun', ['pm', 'pack', '--ignore-scripts', '--filename', 'consumer.tgz'], 'pack');
        console.log(run(process.execPath, ['scripts/check-package.mjs', join(project, 'consumer.tgz'), '--solid', version], 'packed consumer').trim());
      }
      results.push({ version, passed: true });
    } catch (error) {
      results.push({ version, passed: false, error: error.message });
      const log = join(workspace, `${version}.log`);
      await writeFile(log, error.stack ?? error.message);
      const detail = error.message.split(/\r?\n/).find(line => /error TS|Error:|expected/i.test(line)) ?? error.message.split(/\r?\n/)[0];
      console.error(`Solid ${version}: ${detail ?? error.message}; ${args.includes('--keep') ? log : 'use --keep to retain diagnostics'}`);
    }
  }
  console.log(JSON.stringify(results.map(({ version, passed }) => ({ version, passed }))));
  process.exitCode = results.every(result => result.passed) ? 0 : 1;
} finally {
  if (args.includes('--keep')) console.log(`Matrix snapshots: ${workspace}`);
  else {
    assert.equal(dirname(resolve(workspace)), resolve(tmpdir()), 'Refusing cleanup outside temp root');
    await rm(workspace, { recursive: true, force: true });
  }
}
