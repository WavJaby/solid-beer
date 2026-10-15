# Installation

[Usage and examples](README.md) / [Choose your setup](#choose-your-setup) / [Demo hosting](#demo-hosting)

## Choose your setup

| Project | Start here | Required changes |
| --- | --- | --- |
| Empty directory | [Create Solid Beer](#create-solid-beer) / [New project](#new-project) | Generate the ready-made starter or create a Solid app manually |
| Existing Solid app | [Existing project](#existing-project) | Keep compatible dependencies and build settings; add styles/runtime |
| SSR / SolidStart | [SSR / SolidStart](#ssr--solidstart) | Load runtime only on the client; keep server/client Solid transforms |
| App using Tailwind | [Optional Tailwind utilities](#optional-tailwind-utilities) | Optional app-owned utilities; adjust Preflight and review class conflicts |
| Compiler settings | [Vite compiler](#vite-compiler) | Configure the manual setup or disable compilation |

All manual setups share [package installation](#install-package) and [app setup](#app-setup). Generated starters already include app setup.

## Requirements

- SolidJS `^1.9.9` (Solid 1.x), with a Solid-aware JSX build and CSS/asset imports. Use `^1.9.17` for new projects; existing projects can keep any version satisfying `^1.9.9`. This is not a React/Vue component library.
- Node.js `^20.19.0 || >=22.12.0` for the recommended Vite 8 starter. Use npm or Bun as the package manager; Bun is not required by library users. Existing apps follow their own toolchain's Node requirement.
- Vite `^5.0.0 || ^6.4.4 || ^7.3.7 || ^8.3.4` if installed. Use a compatible Solid plugin; Vite 8 requires vite-plugin-solid 2.11.14 or newer within its compatible range.
- A modern browser with native `<dialog>` support. Import the browser runtime on the client only.

BeerCSS and material-dynamic-colors are package dependencies; no global provider is needed.

### Solid compatibility

Recorded 2026-10-14: Solid 1.9.9 and 1.9.17 passed TypeScript, 162 client + 11 SSR tests, builds and fresh tarball consumers with/without the optional compiler. The minimum accounts for compiler-generated runtime helpers and native dialog types; Solid 2 prereleases are unsupported.

### Vite compatibility

Vite 6.4.4, 7.3.7 and 8.3.4 passed fresh consumer checks with both Solid endpoints: strict public types, HTTP development transforms, normal server shutdown, builds, compiler lowering, CSS/assets, lazy modules and executed SSR. Earlier 6/7/8 releases are not declared supported. Evidence covers static checks, unit tests and isolated runtime; no real-browser hydration lifecycle was measured.

Vite 5 remains a legacy peer for existing projects; its build/SSR path is retained. Prefer Vite 8 for new apps. Vite 5 has known development-server advisories, and its development-server shutdown probe did not complete normally under the tested Node 24 environment.

## Install package

Manual setup includes the compiler by default. Install the library:

```sh
npm install solid-beer
# Or:
bun add solid-beer
```

Keep a compatible Solid version; otherwise install `solid-js@^1.9.17` with the same package manager. Next, complete [compiler setup](#vite-compiler) and [app setup](#app-setup). To omit compilation, follow [Disable the compiler](#disable-the-compiler). Package installation alone does not edit Vite configuration. CLI-generated apps already declare their dependencies: run their printed install command instead.

### Local tarball

In the library checkout, create a fresh archive:

```sh
bun install
bun pm pack
```

In the app, install the named local dependency:

```sh
npm install "solid-beer@file:/absolute/path/solid-beer-0.1.0.tgz"
# Or:
bun add "solid-beer@file:/absolute/path/solid-beer-0.1.0.tgz"
```

Use your archive's path; on Windows use forward slashes, for example `solid-beer@file:E:/packages/solid-beer-0.1.0.tgz`. Explicit naming replaces the dependency without a registry lookup. Pack and reinstall after library changes. Tarball and registry installs use the same public imports.

## New project

Use the configured CLI starter, copy it from the checkout, or configure an official Vite app manually.

### Create Solid Beer

Generate a configured Solid + TypeScript + Vite app with one package manager:

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

The starter includes Vite/TypeScript configuration, a sample app with Button/Collapsible/DialogStack and the compiler with its direct Babel dev dependency. To opt out, use `npm create solid-beer@latest my-app -- --no-compiler` or `bunx create-solid-beer@latest my-app --no-compiler`. Tailwind is not installed. The CLI creates files in new or empty destinations, including `.`; it refuses nonempty destinations and does not install dependencies or initialize Git.

To test local changes, [pack the library](#local-tarball), then run from this checkout:

```sh
bun run build:create
node packages/create-solid-beer/dist/index.mjs my-app --library ./solid-beer-0.1.0.tgz --package-manager bun
cd my-app
bun install
bun run dev
```

The packed CLI includes the starter and pins the library version captured at build time; `--library` overrides it with an exact version or an absolute local archive dependency. See the [CLI README](packages/create-solid-beer/README.md) for options and release order.

### Manual Vite setup

1. Create an official Solid app with one package manager:

   ```sh
   npm create vite@latest my-app -- --template solid-ts
   # Or:
   bunx create-vite@latest my-app --template solid-ts
   ```

2. Enter `my-app` and [install the library](#install-package).
3. Remove the starter's `./index.css` and `./App.css` imports; their resets/layout conflict with BeerCSS. Apply [app setup](#app-setup).

For JavaScript, select `solid` instead of `solid-ts`. create-vite 9.2.1 with Vite 8.3.4, vite-plugin-solid 2.11.14 and TypeScript 6.0.3 was verified on 2026-10-14; these commands select the latest official starter.

### Included starter

To use the CLI's template without running the CLI, copy `templates/solid-ts/` from this checkout to a new destination. In PowerShell:

```powershell
Copy-Item -LiteralPath ./templates/solid-ts -Destination ../my-app -Recurse
cd ../my-app
```

Follow [package installation](#install-package), then [run the app](#run-the-app). The library npm archive ships `dist/`, not this template. Do not copy `dev/`, which depends on repository source and demo tooling. See the [starter README](templates/solid-ts/README.md) for editing instructions.

## Existing project

1. Check [requirements](#requirements); keep the app's router, providers, plugins and state. A Vite upgrade also needs a compatible Solid plugin and Node version.
2. [Install the library](#install-package) and apply [app setup](#app-setup) without replacing the app root.
3. Review existing resets/global classes, then build and check forms, navigation and dialogs. If using Tailwind, follow its [integration settings](#optional-tailwind-utilities).

React/Vue apps need a separate Solid integration; installing this package does not convert them.

## App setup

For client-rendered apps, import styles and browser runtime once in the existing browser entry; keep its render call:

```tsx
import 'solid-beer/styles.css'
import 'solid-beer/runtime'
```

Alternatively, put `@import 'solid-beer/styles.css';` in the application's stylesheet instead of the JS stylesheet import. Do not load either stylesheet twice or also load BeerCSS CDN CSS/JS. Server-rendered apps use the [SSR runtime setup](#ssr--solidstart).

See the [usage examples](README.md#native-jsx-or-components) for native JSX and components.

### Run the app

Run `npm run dev` or `bun run dev` and check the dialog button/collapsible panel. Run `npm run build` or `bun run build` before deployment.

### Vite and TypeScript settings

Follow [compiler setup](#vite-compiler) for the Vite plugin; preserve `solidPlugin()` and existing plugins. If compilation is disabled, no library-specific Vite configuration is needed. No source aliases, `optimizeDeps` entries or manual export conditions are required. Neither the compiler nor [Tailwind](#optional-tailwind-utilities) needs extra tsconfig settings.

Merge missing Solid JSX settings into the existing tsconfig; preserve framework settings, types and path aliases:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "moduleResolution": "bundler"
  }
}
```

`bundler` is the starter default; retain another mode if the toolchain resolves package exports correctly. Declarations are included: no library-specific `types`, `paths` or ambient declarations. JavaScript apps need no tsconfig for this library.

### SSR / SolidStart

Import shared CSS through the framework's root stylesheet path. Load `solid-beer/runtime` from its client-only entry, or use root `onMount` as below. Wait for initialization before calling toast APIs. Preserve the framework's Solid bundler integration so the `solid` export condition receives server/client JSX transforms; do not alias SSR imports to the compiled client entry `dist/index.js`.

If the framework has no separate client entry, add this setup inside the existing root component and preserve its router/providers:

```tsx
import { createSignal, onMount } from 'solid-js'
import { Button, dialog } from 'solid-beer'

export default function App() {
  const [runtimeReady, setRuntimeReady] = createSignal(false)
  onMount(() => {
    void import('solid-beer/runtime').then(() => setRuntimeReady(true))
  })

  return (
    <Button disabled={!runtimeReady()} onClick={() => dialog.toast('Ready')}>Show toast</Button>
  )
}
```

Solid's [onMount](https://docs.solidjs.com/reference/lifecycle/on-mount) is client-only; the disabled button gates toast calls until initialization. This framework-neutral pattern has not been tested through a complete SolidStart lifecycle; package checks execute isolated Vite SSR output.

### Optional Tailwind utilities

Install Tailwind only for application utilities. Library `tw:*` utilities are precompiled: no consumer Tailwind build or package-source scanning is required.

#### Tailwind 4

Follow the [official Vite installation](https://tailwindcss.com/docs/installation/using-vite) for the app's own Tailwind build. Install the build dependencies with one package manager:

```sh
npm install -D tailwindcss @tailwindcss/vite
# Or:
bun add -d tailwindcss @tailwindcss/vite
```

Add `tailwindcss()` to the existing Vite plugins, before `solidPlugin()`:

```ts
import tailwindcss from '@tailwindcss/vite'
```

Adjust the official CSS import to [omit Preflight](https://tailwindcss.com/docs/preflight#disabling-preflight). In the application's `src/app.css`, use:

```css
@import 'solid-beer/styles.css';
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
```

Replace the direct library CSS import with `import './app.css'` in the browser entry; keep its runtime setup. Use normal Tailwind classes such as `flex` and `gap-4`. An optional application `prefix(...)` must appear on both Tailwind imports; it need not match internal `tw:` classes.

#### Existing Tailwind 3 apps

Keep Tailwind 3/PostCSS, content paths, theme, prefixes and module format. Merge [the Preflight setting](https://v3.tailwindcss.com/docs/preflight#disabling-preflight) into the existing config without replacing other options:

```js
export default {
  corePlugins: {
    preflight: false,
  },
}
```

Keep [app setup](#app-setup) and the existing utility CSS pipeline. No Tailwind upgrade or additional Vite plugin is needed.

For either version, disabling Preflight affects existing buttons, inputs, headings and lists. Classes such as `border` and `fixed` also collide with BeerCSS; prefixes address utility names, not global styles or all theme variables. These settings follow official Tailwind guidance; complete Tailwind 3/4 visual coexistence has not been gated by browser tests.

## Vite compiler

The compiler lowers supported BeerCSS primitives to native JSX while retaining stateful components such as dialogs and search. Starters already configure it; for manual installs, add Babel `^7.24.5` and the plugin below. Use a supported Vite version.

```sh
npm install -D "@babel/core@^7.24.5"
# Or:
bun add -d "@babel/core@^7.24.5"
```

Add `solidBeer()` before the existing Solid plugin; preserve the app's other plugins and configuration:

```ts
import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import solidBeer from 'solid-beer/vite'

export default defineConfig({
  plugins: [solidBeer(), solidPlugin()],
})
```

If the app also uses the Tailwind Vite plugin, use `plugins: [tailwindcss(), solidBeer(), solidPlugin()]`.

### Disable the compiler

For a manual install without compilation, skip Babel installation and the Vite plugin above. If already configured:

1. Remove the `solid-beer/vite` import and `solidBeer()` call from Vite config; keep `solidPlugin()` and other plugins.
2. If nothing else uses the direct Babel dev dependency, remove it with one package manager:

   ```sh
   npm uninstall -D @babel/core
   # Or:
   bun remove @babel/core
   ```

Components, CSS and runtime work without the compiler. The Solid plugin may still depend on Babel internally.

## Demo hosting

The demo is a static Vite app with hash navigation; GitHub Pages needs no server or SPA rewrite. [.github/workflows/pages.yml](.github/workflows/pages.yml) builds `dev/` on pushes to `main` and manual runs, then deploys `dev/dist/` through the `github-pages` environment.

1. Push this repository and workflow to GitHub. In **Settings -> Pages -> Build and deployment -> Source**, select **GitHub Actions**.
2. Push to `main` or run **Deploy demo to Pages** from the Actions tab.
3. Open the deployment URL shown by the workflow. For `WavJaby/solid-beer`, the default project URL is `https://wavjaby.github.io/solid-beer/`.

The workflow reads the Pages base path instead of hardcoding the repository name; this also supports root sites/custom domains. Only static demo assets are uploaded; npm publication is separate. See [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [Vite deployment](https://vite.dev/guide/static-deploy.html#github-pages).

Local production preview:

```sh
bun run build:demo --base /solid-beer/
bun run preview:demo --base /solid-beer/
```

Check with `bun run check:demo --base /solid-beer/ --run`; use `--base /` for root hosting. The check builds into an isolated temp directory, asserts BeerCSS runtime retention and verifies page/asset responses; it does not automate browser interactions.

## Repository development

Clone the repository, then run:

```sh
bun install
bun run dev
```

The demo includes interactive examples and copyable Component API/Native JSX. With Node installed, `bun run lint`, `bun run test` and `bun run build` validate the library; `npm run` accepts the same script names. Development uses Bun 1.4.3, pinned in package.json; this is not a consumer requirement. `update-deps` is Bun-specific lockfile maintenance.

Run `bun run check:docs` to gate README/INSTALL separation, links, snippets and public-guide packaging before pushing documentation changes. Run `bun run format:check` to check source/demo formatting; `bun run format` applies it. CI checks formatting without committing changes.

Before release, run `bun pm pack` and `bun run check:package /absolute/path/solid-beer-<version>.tgz`. The package check requires Bun + Node, downloads a fresh consumer's dependencies and verifies CSS/assets, lazy imports and SSR with/without the compiler. `--keep` preserves the consumer for inspection. It does not test browser interactions.

To check a consumer toolchain explicitly, run `bun run check:package /absolute/path/solid-beer-<version>.tgz --vite 8.3.4 --solid 1.9.9 --dev`. Version flags also check published types with strict TypeScript; `--dev` adds an HTTP development transform + normal shutdown gate. Omit `--dev` to check production/SSR independently.

Run the Solid compatibility matrix with `bun run check:solid --versions 1.9.9,1.9.17 --run` (npm: `npm run check:solid -- --versions 1.9.9,1.9.17 --run`). It installs isolated snapshots with the locked toolchain, selects each exact Solid runtime and verifies types, builds, client/SSR tests and tarball consumers without changing repository dependencies. Omit `--run` for a dry run; `--types-only` probes type boundaries and `--keep` retains snapshots/logs. `check:package --solid <exact-version>` checks a single prebuilt archive against another consumer runtime.

Validate the CLI-generated starter with `bun run check:template /absolute/path/solid-beer-<version>.tgz --run` (npm: `npm run check:template -- /absolute/path/solid-beer-<version>.tgz --run`). It builds the repository CLI, generates a fresh app, installs the library archive with Bun and checks strict types, a Node production build and CSS/assets. Add `--no-compiler` to check the opt-out setup, or `--cli /absolute/path/create-solid-beer-<version>.tgz` to test the packed CLI in isolation. Omit `--run` for a dry run; `--keep` retains the project. Run `bun run test:create` for CLI input/overwrite safety tests. These gates do not exercise browser interactions.
