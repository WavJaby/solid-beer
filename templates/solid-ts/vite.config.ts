import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import solidBeer from 'solid-beer/vite';

export default defineConfig({
  plugins: [solidBeer(), solidPlugin()],
});
