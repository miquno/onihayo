# src/lib/content/

Onihayo's learning content as typed, versioned data ([ADR 0003](../../../docs/decisions/0003-content-as-versioned-data.md)). Plain TypeScript: imports neither `svelte` nor `$app/*`, and does no I/O. Provenance and licensing rules: `docs/content/`.

## Map

- `model.ts` — the content model: `ContentOrigin`, dataset `Provenance`, and the kana types (`KanaRecord`, `KanaClass`, `kanaRows` in gojūon order).
- `kana/` — Onihayo-authored kana data under CC BY-SA 4.0 (`kana/LICENSE`). `hiragana.ts`: the 46 basic hiragana, 25 with dakuten/handakuten, and 33 yōon, in gojūon order, with the dataset's `provenance`.
- `hiragana.test.ts` — what the data says: the hiragana inventory, readings, accepted alternatives, ID scheme, and origin.
- `kana-dataset.test.ts` — dataset validation: exact counts per class, unique IDs and characters (precomposed hiragana), non-empty lowercase romaji, no duplicate alternatives, complete rows in gojūon order within one class, and an origin on every record.

## Rules

- A content directory holds content only, under the single licence in its `LICENSE` file. Types, helpers, and tests are code (MIT) and live outside it, here in `src/lib/content/`.
- Onihayo-authored content directories carry the CC BY-SA 4.0 legal code as `LICENSE` ([ADR 0006](../../../docs/decisions/0006-code-and-content-licensing.md)). Imported data keeps its own licence and follows the import checklist in `docs/content/README.md`.
- Every record has a stable ID (`kana.hiragana.shi`) that is never renamed or reused, because learner progress refers to it, and states its `origin` (`imported`, `generated`, or `authored`). Every dataset exports its `provenance`.
- Kana IDs use the Hepburn reading; where two kana share a reading, the later one uses its Nihon-shiki spelling (ぢ → `di`, づ → `du`).
- Romaji is Hepburn. `alternatives` lists every other spelling practice accepts, and nothing more: Kunrei-shiki and Nihon-shiki spellings where they differ, `o` for を, and `nn` for ん.
- Kana are stored precomposed (NFC); romaji and alternatives are lowercase ASCII letters, the form answers are compared in. A dataset change keeps `kana-dataset.test.ts` passing; never loosen a validation rule to admit a record.
- Content is text: never HTML or Markdown to be rendered as markup.
- Authored Japanese is reviewed by a fluent speaker before release; the pull request notes the review.
