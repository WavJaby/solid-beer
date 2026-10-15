import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import autoprefixer from 'autoprefixer';
import postcssNested from 'postcss-nested';
import path from 'path';
import solidBeer from '../src/vite';
import { exampleSources } from './site/example-plugin';

export default defineConfig({
  resolve: {
    alias: {
      src: path.resolve(__dirname, '../src'),
    },
  },
  plugins: [
    tailwindcss(),
    exampleSources(),
    solidBeer({ importSources: ['solid-beer', '../../src', 'src'] }),
    solidPlugin(),
  ],
  css: {
    postcss: {
      plugins: [postcssNested(), autoprefixer()],
    },
    devSourcemap: true,
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
