# 0014. Onihayo-curated N5 kanji with KANJIDIC2 and KanjiVG data

- Status: Accepted
- Date: 2026-10-26

## Context

Milestone 0.11 teaches the N5 kanji with meanings, readings, stroke order, and links
to words the learner already knows. Before any kanji data is imported, Onihayo needs a
verified licence for each source, an attribution plan, a share-alike boundary, and a
decision on which kanji the curriculum teaches.

As for vocabulary ([ADR 0013](0013-n5-vocabulary-selection.md)), the
[JLPT FAQ](https://jlpt.jp/sp/e/faq/index.html) states that no kanji specification is
published for the post-2010 levels. KANJIDIC2's `jlpt` field records the pre-2010 four-level
scale; the EDRDG documentation says no official lists exist for the new levels and that
old level 4 is regarded as similar to N5. The 2026-10-26 KANJIDIC2 file marks 103 kanji as
old level 4, all of jōyō grades 1–3, and every one of them occurs in the first written form
of at least one `onihayo.n5.v1` word.

## Decision

### Selection

Use an **Onihayo-curated N5-oriented kanji selection**, identified as
`onihayo.n5.kanji.v1`. Membership and teaching order are authored for Onihayo; kanji
facts are imported from KANJIDIC2 and stroke data from KanjiVG.

- The candidate pool is KANJIDIC2's old level 4. It is an input to curation only: the level
  is not stored in the dataset, not shown to learners, and not called an official N5 list.
- Every selected kanji needs a rationale tied to a coverage category (numbers and money,
  time and calendar, people and family, body, nature and weather, places and directions,
  school and language, everyday actions, descriptions) and at least one example word from
  `onihayo.n5.v1` whose usual written form contains it. A rare written form (彼処 for
  あそこ) does not count as an example.
- Onihayo may add a jōyō kanji outside the pool when a selected word is commonly written with
  it and it serves a category (曜 for the days of the week), or leave a candidate out, each
  with a recorded rationale. No fixed count is presented as an exam requirement.
- For each kanji, choose the meanings and readings a beginner needs, taken from its
  KANJIDIC2 record and matching its example words, rather than teaching every dictionary
  reading.
- Kanji IDs are `kanji.` followed by the lowercase hexadecimal Unicode code point with at
  least four digits (`kanji.4e00` for 一). They are never renamed or reused.
- The import item commits a versioned, authored selection manifest (entries, categories,
  rationales, example word IDs, chosen meanings and readings) under
  `src/lib/content/kanji/`. The manifest and the imported dataset must agree exactly.
  Later membership changes are recorded explicitly.

### KANJIDIC2

- The [EDRDG General Dictionary Licence Statement](https://www.edrdg.org/edrdg/licence.html),
  checked on 2026-10-26, makes KANJIDIC2 available under
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), with no restriction on
  commercial use. Its attribution, share-alike, warranty, and monthly-update conditions are
  those already followed for JMdict ([ADR 0010](0010-jmdict-vocabulary-source.md)).
- Import only these fields: `literal`, the `ucs` code point, `grade`, the first
  `stroke_count`, `ja_on` and `ja_kun` readings, and English meanings (those without an
  `m_lang` attribute). The importer may read `jlpt` to build the candidate list for review
  but does not write it.
- Exclude everything under the licence statement's special conditions or not needed: SKIP
  codes (now under a NonCommercial licence, which [ADR 0006](0006-code-and-content-licensing.md)
  rules out), the other query codes (Spahn & Hadamitzky, Four Corner, De Roo), dictionary
  index numbers, Pinyin, Korean and Vietnamese readings, non-English meanings, nanori, and
  radical names.
- Store the KANJIDIC2-derived data, the authored selection, and their CC BY-SA 4.0 licence
  in `src/lib/content/kanji/`. Pin the release by `database_version` and checksum,
  verify the archive before parsing, and review the latest release monthly together with
  JMdict.
- Each page that displays KANJIDIC2-derived data acknowledges EDRDG and KANJIDIC2 with links
  to the [KANJIDIC project](https://www.edrdg.org/wiki/KANJIDIC_Project.html) and the
  licence statement, without implying endorsement. `NOTICE` and the Licences page list
  KANJIDIC2 when the first data is committed.

### KanjiVG

- [KanjiVG](https://kanjivg.tagaini.net/), checked on 2026-10-26, is copyright Ulrich Apel and
  released under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Every SVG
  file repeats this and asks users to state their use of KanjiVG in their own copyright
  header and to link to the KanjiVG website. The latest release is `r20260714`.
- Import the standard (non-variant) file of each selected kanji from a pinned,
  checksum-verified release archive. Keep only the stroke paths in order and the stroke
  number positions. No archive file is committed or served as is.
- Keep the KanjiVG-derived stroke data in its own directory with the CC BY-SA 3.0 legal code
  as its `LICENSE` and a header that names KanjiVG, Ulrich Apel, the release, and the
  website. CC BY-SA 3.0 would allow adaptations under 4.0, but keeping 3.0 holds whether or
  not the import counts as an adaptation.
- Kanji pages that show stroke diagrams credit KanjiVG with a link; `NOTICE` and the Licences
  page list it when the first data is committed.

## Alternatives considered

- **Use KANJIDIC2's old level 4 as is.** Simple, but it would present a legacy level as the
  current N5 list and could not be adjusted to Onihayo's vocabulary.
- **Import a community or third-party N5 kanji list.** A freely shared beginner PDF was
  evaluated on 2026-10-26 (see the source register). It grants only an informal permission to
  share, gives no explicit licence to adapt, and mixes in authored memory hints, vocabulary
  choices, and advertising. Its kanji are the KANJIDIC2 old-level-4 set, so it adds no data
  beyond the licensed source. Nothing is taken from it.
- **Draw stroke order for Onihayo.** Avoids a second licence but duplicates a mature,
  reviewed dataset and would need its own review.

## Consequences

- No runtime code, dataset, dependency, storage, or network behaviour changes with this
  decision. `NOTICE` and the Licences page are unchanged until data is imported.
- The import item validates unique IDs, selection-to-dataset equality, at least one meaning,
  one reading and one example word per kanji, stroke data for every kanji, and that no excluded
  field reaches the output.
- Stroke data is generated at import time and rendered by Svelte as inline SVG from validated
  path data (each path checked against the SVG path grammar). No archive markup and no user
  input reaches the page, so no CSP change or third-party origin is needed.
- Kanji progress uses the same item model, stages, and reviews as kana and words.
