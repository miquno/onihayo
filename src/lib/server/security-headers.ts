/**
 * Response headers applied to every response that passes through SvelteKit.
 *
 * The Content Security Policy is not set here: SvelteKit generates it from
 * `kit.csp` in `svelte.config.js` so it can add per-request nonces.
 *
 * Static files served directly by the Node adapter (client bundles, `static/`)
 * bypass SvelteKit hooks. The reverse proxy must add at least HSTS and
 * `X-Content-Type-Options` to those; see docs/deployment/hosting.md.
 */
export const securityHeaders: Readonly<Record<string, string>> = {
  // HTTPS-only in production. `includeSubDomains` and `preload` are deliberate
  // per-domain decisions made at deployment time, not defaults.
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  // Legacy fallback for browsers that ignore CSP `frame-ancestors`.
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  // Deny powerful features Onihayo does not use. Enabling one (for example the
  // microphone for speaking practice) is a documented product decision.
  'Permissions-Policy':
    'accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), hid=(), magnetometer=(), microphone=(), midi=(), payment=(), serial=(), usb=(), browsing-topics=()'
};

export function applySecurityHeaders(headers: Headers): void {
  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value);
  }
}
