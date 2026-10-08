import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { bundledLicences } from './scripts/licences/bundled-licences.ts';

export default defineConfig({
  plugins: [sveltekit(), bundledLicences()],
  // Keep Valibot in the SSR bundle. Node runtime packages that remain external
  // are copied as production-only dependencies into the container image.
  ssr: { noExternal: ['valibot'] },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node'
  }
});
