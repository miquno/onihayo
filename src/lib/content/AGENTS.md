# src/lib/content/

Onihayo's learning content as typed, versioned data ([ADR 0003](../../../docs/decisions/0003-content-as-versioned-data.md)). Plain TypeScript: imports neither `svelte` nor `$app/*`, and does no I/O. Provenance and licensing rules: `docs/content/`.

## Map

- `model.ts` — the content model: `ContentOrigin`, dataset `Provenance`, the kana types (`KanaRecord`, `KanaScript`, `KanaClass`, `kanaRows` in gojūon order), and `KanaLesson` (rows taught together, with a pronunciation note and notes for individual kana).
- `lessons.ts` — lesson helpers: `lessonSlug()` (URL segment from the lesson ID), `findLesson()` (exact slug match only), `nextLesson()`, and `lessonKana()` (the kana of a lesson's rows in dataset order). Tested in `lessons.test.ts`.
- `selection.ts` — choosing kana by row across scripts for the kana quiz: row keys (`hiragana.ka`, `katakana.kya`), `parseRowSelection()` (keeps only known keys from untrusted URL values, once each, in display order), `rowSelectionSearch()` (the `?rows=` query string), `selectedScripts()`, `selectedKana()`, and `rowsByClass()` (a script's rows grouped by class). Tested in `selection.test.ts`.
- `chart.ts` — `kanaChart()`: the gojūon grid of one kana class for the chart page. A kana's column is the vowel its romaji ends in (ya/yu/yo for yōon), empty positions are `null`, and a row whose only kana ends in no vowel (ん) spans the row. `chart.test.ts` pins the grids and checks that the three charts show every hiragana once.
- `kana/` — Onihayo-authored kana data under CC BY-SA 4.0 (`kana/LICENSE`). `hiragana.ts`: the 46 basic hiragana, 25 with dakuten/handakuten, and 33 yōon, in gojūon order, with the dataset's `provenance`. `katakana.ts`: the same 104 sounds in katakana, in the same order with the same readings and alternatives, and its own `provenance`. `hiragana-lessons.ts`: 18 lessons (one per row, わ/を/ん together, three for yōon) with authored English pronunciation notes and their own `provenance`.
- `hiragana.test.ts` — what the data says: the hiragana inventory, readings, accepted alternatives, ID scheme, and origin.
- `katakana.test.ts` — the same for katakana: the inventory per class, and that it spells exactly the sounds of hiragana (same order, rows, classes, readings, alternatives, and IDs apart from the script).
- `kana-dataset.test.ts` — dataset validation, run for each script: exact counts per class, unique IDs and characters (precomposed kana of that script), non-empty lowercase romaji, no duplicate alternatives, complete rows in gojūon order within one class, and an origin on every record. Also that no ID or character appears in both scripts.
- `hiragana-lessons.test.ts` — lesson validation: the lessons teach every hiragana exactly once in dataset order, rows in gojūon order, IDs named after the first row, one kana class and 3–12 kana per lesson, plain-text titles and notes, kana notes only for kana the lesson teaches.

## Rules

- A content directory holds content only, under the single licence in its `LICENSE` file. Types, helpers, and tests are code (MIT) and live outside it, here in `src/lib/content/`.
- Onihayo-authored content directories carry the CC BY-SA 4.0 legal code as `LICENSE` ([ADR 0006](../../../docs/decisions/0006-code-and-content-licensing.md)). Imported data keeps its own licence and follows the import checklist in `docs/content/README.md`.
- Every record has a stable ID (`kana.hiragana.shi`, `kana.katakana.shi`) that is never renamed or reused, because learner progress refers to it, and states its `origin` (`imported`, `generated`, or `authored`). Every dataset exports its `provenance`.
- Kana IDs use the Hepburn reading; where two kana share a reading, the later one uses its Nihon-shiki spelling (ぢ → `di`, づ → `du`; ヂ, ヅ likewise). A kana ID names its script, so a hiragana and its katakana are separate items.
- Romaji is Hepburn. `alternatives` lists every other spelling practice accepts, and nothing more: Kunrei-shiki and Nihon-shiki spellings where they differ, `o` for を/ヲ, and `nn` for ん/ン.
- Kana are stored precomposed (NFC); romaji and alternatives are lowercase ASCII letters, the form answers are compared in. A dataset change keeps `kana-dataset.test.ts` passing; never loosen a validation rule to admit a record.
- Lesson IDs (`lesson.hiragana.ka`) follow the same rule as item IDs: never renamed or reused, because lesson progress will refer to them. The part after the last dot is the lesson's URL.
- Content is text: never HTML or Markdown to be rendered as markup.
- Authored Japanese is reviewed by a fluent speaker before release; the pull request notes the review.
