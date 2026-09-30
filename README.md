# Onihayo

Learn Japanese from absolute zero to JLPT N5 in one structured place.

Onihayo is an open-source web application for complete beginners. It guides you from your first hiragana through katakana, vocabulary, kanji, grammar, and short reading and listening exercises until you are ready for the JLPT N5 — so you never have to wonder what to learn next.

> **Status:** foundation stage. There are no lessons yet. Development follows the milestones in [ROADMAP.md](ROADMAP.md).

## Principles

- **Beginner first.** Someone with zero Japanese knowledge immediately knows where to start.
- **One place for everything.** Kana, vocabulary, kanji, grammar, reviews, and progress are parts of one system.
- **Learn → Practice → Review → Master.** One learning model, reused everywhere.
- **N5 first.** No speculative N4–N1 features.
- **Calm design.** No manipulative streaks, dark patterns, or visual noise.
- **Accessible from day one.** Keyboard, screen readers, focus handling, reduced motion, and contrast are requirements.
- **Private by design.** No ads, no tracking, no third-party scripts, and as little personal data as possible.

## Development

Requirements: Node.js 24 LTS (22.12+ works) and pnpm 10 (`corepack enable` picks the pinned version).

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm verify       # format check, lint, type check, unit tests, production build
pnpm test:e2e     # browser, accessibility, and security-header tests against the production build
```

Production server: `pnpm build && ORIGIN=https://your.domain pnpm start`, or the container image: `docker build --tag onihayo .` then `docker run --env ORIGIN=https://your.domain --publish 3000:3000 onihayo`. See [docs/deployment/hosting.md](docs/deployment/hosting.md).

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — how the application is structured
- [ROADMAP.md](ROADMAP.md) — milestones from foundation to the 1.0 zero-to-N5 release
- [CONTRIBUTING.md](CONTRIBUTING.md) — workflow, commits, and sign-off
- [AGENTS.md](AGENTS.md) — repository rules for contributors and coding agents
- [SECURITY.md](SECURITY.md) — reporting vulnerabilities and the security model
- [docs/](docs/README.md) — decisions, security, deployment, and content licensing

## License

Code is released under the [MIT License](LICENSE). Learning content written for Onihayo is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Third-party learning data, when added, keeps its own licence; see [NOTICE](NOTICE) and [docs/content/](docs/content/README.md).
