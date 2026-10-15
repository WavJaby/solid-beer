# create-solid-beer

Create a Solid Beer app with Solid + TypeScript + Vite. Styles/runtime, Button, DialogStack and Collapsible are configured; the compiler is enabled by default, Tailwind is not installed. Requires Node.js `^20.19.0 || >=22.12.0`.

## Published usage

These commands become available after `solid-beer` and `create-solid-beer` are published:

```sh
npm create solid-beer@latest my-app
cd my-app
npm install
npm run dev
```

```sh
bunx create-solid-beer@latest my-app
cd my-app
bun install
bun run dev
```

The CLI creates files only. It accepts new or empty directories, including `.`, and refuses nonempty directories. It does not install dependencies, initialize Git or modify an existing app.

## Options

- `--package-manager npm|bun`: choose printed next commands; defaults to the detected runner, otherwise npm.
- `--library <exact-version|archive.tgz>`: override the library version captured when this CLI was built; local archive paths are resolved from your current directory.
- `--no-compiler`: omit the library Vite plugin and direct `@babel/core` dev dependency. Components still work; the Solid plugin may use Babel internally.
- `--help` / `--version`: show usage / CLI version.

Forward npm options after `--`, for example `npm create solid-beer@latest my-app -- --no-compiler`. With Bun: `bunx create-solid-beer@latest my-app --no-compiler`.

## Before publication

From the repository root:

```sh
bun pm pack
node packages/create-solid-beer/scripts/build.mjs
node packages/create-solid-beer/dist/index.mjs my-app --library ./solid-beer-0.0.0.tgz
cd my-app
bun install
bun run dev
```

Use a fresh library archive. The generated dependency points to its absolute path; keep the archive available until you switch to a published version. Run `npm install` / `npm run dev` instead for npm.

## Maintain

`templates/solid-ts/` in the repository is the template source. `build` stages it into this package's `dist/`, pins the library version from the root manifest and renames `.gitignore` for npm packaging; generation restores its name. No repository files are needed when running the packed CLI.

Run `node --test packages/create-solid-beer/test/cli.test.mjs` after building, or `npm test` / `bun run test` in this package. Pack from this package with `npm pack` or `bun pm pack`; the prepack hook builds first. Publish the referenced library version before publishing the CLI. Neither package is published automatically.
