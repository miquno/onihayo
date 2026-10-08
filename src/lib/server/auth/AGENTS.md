# `src/lib/server/auth/`

Server-only account authentication. Routes render forms and call this boundary; database queries live in `../db/`.

## Rules

- Keep tokens, email addresses, session cookies, provider credentials, and IP addresses out of logs and client data.
- Validate form values and configuration before use. Use Node's cryptographic random source and standard SHA-256/HMAC; never create bearer tokens from predictable values.
- Authentication mail uses plain text through the Frankfurt SES endpoint. The sender and credentials are deployment configuration, never source code.
- Session cookies are `__Host-` scoped, secure, HTTP-only, and same-site. Every authentication mutation uses POST and the existing SvelteKit CSRF origin check.
- Apply the PostgreSQL-backed IP and email limits before issuing or consuming a link. Do not extend a blocked bucket's cooldown on denied requests.
