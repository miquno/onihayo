import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { bundledLicences } from './scripts/licences/bundled-licences.ts';

export default defineConfig({
  plugins: [sveltekit(), bundledLicences()],
  // The production image contains only build/ and package.json. Bundle runtime
  // dependencies into SSR output instead of leaving bare package imports.
  ssr: { noExternal: ['valibot'] },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node'
  }
});
