# src/lib/learning/

The learning engine: plain TypeScript that turns content into practice. Imports neither `svelte` nor `$app/*`, does no I/O, and depends only on `src/lib/content/` types (`ARCHITECTURE.md`).

## Map

- `normalize.ts` — `normalizeAnswer()`: brings a typed answer into the form content is stored in (NFKC, trimmed, lowercase; inner spaces kept). `normalize.test.ts` also checks that every stored kana, romaji, and alternative is already in that form.

## Rules

- Deterministic: time comes from an injected clock and randomness from an injected random source. Never read `Date.now()`, `new Date()`, or `Math.random()` here.
- Answers are compared only after `normalizeAnswer()`, and against content that is already in normalized form. Never loosen comparison inside a feature; change `normalizeAnswer()` and its tests instead.
- Nothing content-type specific: kana, words, kanji, and grammar go through the same functions (`docs/architecture/learning-model.md`).
- Unit tests sit beside the code as `*.test.ts`.
