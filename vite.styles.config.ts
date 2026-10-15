import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import postcssNested from 'postcss-nested';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';

const styles = ['styles.css', ...readdirSync('src/components', { recursive: true }).filter(file => String(file).endsWith('.css')).map(file => 'components/' + String(file).replaceAll('\\', '/'))];
const cssNames = new Set(styles);

export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
  css: { postcss: { plugins: [postcssNested()] } },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: Object.fromEntries(styles.map(file => [file.slice(0, -'.css'.length), resolve('src', file)])),
      output: {
        assetFileNames: asset => asset.name && cssNames.has(asset.name) ? asset.name : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
