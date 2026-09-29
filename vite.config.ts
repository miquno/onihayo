import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { bundledLicences } from './scripts/licences/bundled-licences.ts';

export default defineConfig({
  plugins: [sveltekit(), bundledLicences()],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node'
  }
});
