import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    // Force runes mode for project files; dependencies decide for themselves.
    runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
  },
  kit: {
    adapter: adapter(),
    typescript: {
      // Build tooling in scripts/ (such as the Licences page plugin) is type-checked
      // and linted like application code.
      config: (/** @type {{ include: string[] }} */ tsconfig) => {
        tsconfig.include.push('../scripts/**/*.ts');
      }
    },
    // Content Security Policy. SvelteKit adds a nonce (server-rendered pages) or a
    // hash (prerendered pages) for its own inline bootstrap script, so no
    // 'unsafe-inline' is needed for scripts. In dev only, SvelteKit adds
    // 'unsafe-inline' to style-src because Vite injects <style> elements.
    // Every allowed origin is a trust decision: see docs/security/web-security.md.
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self'],
        // SvelteKit's route announcer (screen-reader navigation announcements)
        // renders with one fixed inline `style` attribute. Allow exactly that value
        // by hash instead of 'unsafe-inline'. If a SvelteKit upgrade changes it, the
        // E2E console check fails with the new hash. `src/app.css` hides the
        // announcer too, for browsers without 'unsafe-hashes' support.
        'style-src-attr': ['unsafe-hashes', 'sha256-S8qMpvofolR8Mpjy4kQvEm7m1q8clzU4dfDH0AmvZjo='],
        'img-src': ['self', 'data:'],
        'font-src': ['self'],
        'connect-src': ['self'],
        'media-src': ['self'],
        'manifest-src': ['self'],
        'worker-src': ['self'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['none']
      }
    }
    // CSRF: SvelteKit's origin check for form submissions is on by default and
    // `csrf.trustedOrigins` is intentionally left empty. Do not widen it.
  }
};

export default config;
