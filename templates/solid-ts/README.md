# Solid Beer starter

Solid + TypeScript + Vite. Public package imports, compiler enabled by default, no source aliases or Tailwind setup. Requires Node.js `^20.19.0 || >=22.12.0`.

## Start

If `create-solid-beer` generated this app, its library dependency is already configured. Run `npm install` + `npm run dev`, or `bun install` + `bun run dev`.

If you copied this template manually, run the same install/dev commands. To test local library changes, install a freshly built tarball instead:

```sh
npm install "solid-beer@file:/absolute/path/solid-beer-0.1.0.tgz"
# Or:
bun add "solid-beer@file:/absolute/path/solid-beer-0.1.0.tgz"
```

To return to the registry package, set `dependencies.solid-beer` to the published version and run `npm install` or `bun install`.

Use your archive's absolute path; on Windows use forward slashes, for example `solid-beer@file:E:/packages/solid-beer-0.1.0.tgz`. Naming the package explicitly replaces the dependency without a registry lookup.

```sh
npm run dev
# Or:
bun run dev
```

Open the URL printed by Vite. Check the dialog button and collapsible panel. Run `npm run build` or `bun run build` before deployment; `npm run preview` or `bun run preview` serves the built app.

## Edit

- `src/App.tsx`: replace the sample UI; keep one `DialogStack` if using programmatic dialogs.
- `src/index.tsx`: imports shared styles and browser runtime once.
- `vite.config.ts`: app build plugins; the compiler precedes Solid when enabled.

## Disable the compiler

Generate with `create-solid-beer --no-compiler` to omit the plugin and direct `@babel/core` dependency. In an existing generated app, remove the `solid-beer/vite` import and `solidBeer()` call from `vite.config.ts`; remove the direct `@babel/core` dev dependency if nothing else uses it, then reinstall. Components work without compilation. The Solid plugin may still depend on Babel internally.

This starter is a client-rendered app. SSR apps must load the browser runtime from a client-only entry or `onMount`.
