# src/lib/server/

Server-only code. SvelteKit refuses to import anything under `$lib/server` into client code, so this is where secrets, database access, and authentication will live. Everything here runs on the trust side of the network boundary.

## Map

- `security-headers.ts` — the response headers `hooks.server.ts` applies to every SvelteKit response. The CSP is not here: it is generated from `kit.csp` in `svelte.config.js` so SvelteKit can add nonces.

## Rules

- Changing a header or the CSP changes the security posture: update `docs/security/web-security.md` in the same pull request, and the threat model if a new origin or capability is allowed.
- Never add `'unsafe-inline'` or `'unsafe-eval'` to `script-src`, and never add a third-party origin to any directive without a documented decision.
- Read configuration from `$env/dynamic/private` or `$env/static/private` only here, and validate it at startup. Never log secret values.
- Errors returned to clients are generic. Details go to server logs, without request bodies, tokens, passwords, or email addresses.
- Future `db/` and `auth/` folders get their own `AGENTS.md` when they are created (roadmap 0.9).
