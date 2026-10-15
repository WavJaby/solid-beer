import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';
import solidBeer from './src/vite';
import { resolve } from 'node:path';
import { exampleSources } from './dev/site/example-plugin';

export default defineConfig(({ mode }) => {
  // to test in server environment, run with "--mode ssr" or "--mode test:ssr" flag
  // loads only server.test.ts file
  const testSSR = mode === 'test:ssr' || mode === 'ssr';

  return {
    plugins: [
      exampleSources({ hot: false }),
      solidBeer({ include: /test\/fixtures\/compiled-(progress|badge|primitives|dynamic)\.tsx$/ }),
      solidPlugin({
        // https://github.com/solidjs/solid-refresh/issues/29
        hot: false,
        // For testing SSR we need to do a SSR JSX transform
        solid: { generate: testSSR ? 'ssr' : 'dom' },
      }),
    ],
    test: {
      watch: false,
      isolate: !testSSR,
      env: {
        NODE_ENV: testSSR ? 'production' : 'development',
        DEV: testSSR ? '' : '1',
        SSR: testSSR ? '1' : '',
        PROD: testSSR ? '1' : '',
      },
      environment: testSSR ? 'node' : 'jsdom',
      server: { deps: { inline: ['beercss'] } },
      transformMode: { web: [/\.[jt]sx$/] },
      ...(testSSR
        ? {
            include: ['test/server.test.{ts,tsx}'],
          }
        : {
            include: ['test/*.test.{ts,tsx}'],
            exclude: ['test/server.test.{ts,tsx}'],
            setupFiles: ['test/setup-dialog.ts'],
          }),
    },
    resolve: {
      alias: { 'solid-beer': resolve('src/index.tsx'), src: resolve('src') },
      conditions: testSSR ? ['node'] : ['browser', 'development'],
    },
  };
});
