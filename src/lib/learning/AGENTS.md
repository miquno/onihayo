# src/lib/learning/

The learning engine: plain TypeScript that turns content into practice. Imports neither `svelte` nor `$app/*`, does no I/O, and depends only on `src/lib/content/` types (`ARCHITECTURE.md`).

## Map

- `normalize.ts` — `normalizeAnswer()`: brings a typed answer into the form content is stored in (NFKC, trimmed, lowercase; inner spaces kept). `normalize.test.ts` also checks that every stored kana, romaji, and alternative is already in that form.
- `random.ts` — `RandomSource`, the interface every random choice in the engine takes; `createSeededRandom(seed)` (Mulberry32, unsigned 32-bit seeds), `randomInt()`, and `parseSeed()`, which reads a seed from untrusted text such as a URL parameter (plain decimal digits in range, anything else `undefined`). `random.test.ts` pins reference sequences.
- `practice-item.ts` — the practice item contract, `PracticeItem`: what a question needs about one item of any content type (ID, prompt and answer with their `lang`, accepted answers in normalized form, and `ChoiceCandidates`: the group whose items may be offered as options, and preferred IDs in tiers, most similar first).
- `kana-items.ts` — the kana adapter, `kanaPracticeItems(records, lessons)`: one script's kana as practice items (prompt the kana, answer its romaji, every alternative accepted; options from the same script, the lessons' look-alikes first, then the rest of the row). `kana-items.test.ts` checks the items and the contract's rules for both scripts.
- `session.ts` — the practice session state machine (`asking → answered → asking … / finished`) as immutable values: `startSession()` builds a seeded question order in rounds without immediate repeats; `submitAnswer()` checks a normalized answer against the item's accepted answers and records it with a timestamp from an injected `Clock`; `nextQuestion()`, `currentItem()`, `lastAnswer()`, `questionProgress()`, and `summarize()` (accuracy and missed items). Works on `SessionItem`s (ID and accepted answers), never on a content type.

## Rules

- Deterministic: time comes from an injected clock and randomness from an injected `RandomSource`. Never read `Date.now()`, `new Date()`, or `Math.random()` here.
- The seeded sequence is part of the product: the same seed must always give the same question order. Changing the generator changes every seeded order, so the pinned values in `random.test.ts` and the pinned order in `session.test.ts` must keep passing.
- Answers are compared only after `normalizeAnswer()`, and against content that is already in normalized form. Never loosen comparison inside a feature; change `normalizeAnswer()` and its tests instead.
- Nothing content-type specific: kana, words, kanji, and grammar go through the same functions (`docs/architecture/learning-model.md`). Content-specific code lives only in an adapter (`kana-items.ts`) that produces `PracticeItem`s; everything after it, including the practice UI, works on the contract.
- Unit tests sit beside the code as `*.test.ts`.
