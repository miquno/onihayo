# 0013. Onihayo-curated N5 vocabulary with JMdict lexical data

- Status: Accepted
- Date: 2026-10-15

## Context

The first 40 words already use an authored JMdict sequence-number selection,
import tooling under `scripts/content/jmdict/`, and validated lesson data.
The next 0.10 item needs a settled source and licence before expanding that inventory.

The [JLPT FAQ](https://jlpt.jp/sp/e/faq/index.html) explains that the organizers no
longer publish vocabulary, kanji, and grammar specifications after the 2010 revision.
Its [level summary](https://www.jlpt.jp/e/about/levelsummary.html) describes N5 skills,
not a definitive word inventory. Neither a dictionary frequency marker nor a legacy
JLPT level proves that a word belongs to the current N5 exam.

## Decision

Use an **Onihayo-curated N5-oriented selection**, identified as
`onihayo.n5.v1`, with Japanese forms/readings and English glosses from the existing
JMdict import. The selection and teaching order are authored for Onihayo; the
lexical data remains imported from EDRDG. This decision defines the selection
policy, not the finished inventory. The current 40 words are still the beginner set.

- Select words independently for beginner communicative needs. Do not copy a
  commercial course, scrape a learning site, or repackage a community list whose
  reuse terms have not been verified. Do not import legacy JLPT tags as N5 labels.
- Cover introductions and people, family, home and everyday objects, food and
  shopping, numbers and quantities, time and dates, places and directions,
  transport, school and work, daily actions, body and health, weather and seasons,
  descriptions, and basic question/reference expressions. Include useful verbs,
  adjectives and adverbs as well as nouns. Grammar-only particles and inflection
  rules belong to 0.12, rather than inflating the word count.
- Choose a beginner-appropriate reading and meaning for each entry. Resolve
  homographs, restricted readings and multiple senses against the source; do not
  automatically teach every dictionary sense. If an entry cannot yet be imported
  correctly, resolve it in the import work rather than silently changing its meaning.
- Keep existing `word.jmdict.<sequence>` IDs and completed lesson IDs stable.
  Expand the existing selection rather than replacing the first 40 words or
  resetting learner progress. A new word must have a rationale tied to a coverage
  category. No fixed count is represented as an official exam requirement.
- In the dataset item, commit a versioned, authored selection manifest with entry
  references, coverage categories and rationales. Every selected word must be
  traceable to `onihayo.n5.v1`, separately from its JMdict release/source entry.
  The manifest and resulting dataset must agree exactly. Record subsequent
  membership changes explicitly; never change IDs to rename a curriculum version.
- In the lesson item, group the selected words into lessons of at most ten, with
  each word taught once. Show kana first; later kanji teaching controls kanji display.

## Licensing and attribution

The [EDRDG licence statement](https://www.edrdg.org/edrdg/licence.html), rechecked
on 2026-10-15, covers the Japanese and English JMdict components under CC BY-SA 4.0.
Other-language translations remain excluded. Imported readings, forms, meanings,
and adapted subsets retain EDRDG attribution and CC BY-SA 4.0. Onihayo's selection,
rationales and lesson order use CC BY-SA 4.0 under ADR 0006, attributed to
"Onihayo contributors"; these are distinct from EDRDG's lexical work.

Reuse the vocabulary directory's licence, existing `NOTICE`, word-page and Licences
page attribution. The new selection manifest must carry or sit beside the content
licence. No third-party selection is imported by this ADR, so no additional
third-party notice is required now. Recheck notices and displayed attribution when
the expanded dataset is committed. The MIT application code remains separate.

Keep the pinned, checksum-verified JMdict import, release metadata, and monthly
review/update procedure. Do not replace the pin with an unversioned network fetch.

## Alternatives considered

- **Import a community N5 list.** Possible only after verifying its actual reuse
  rights and lineage. No external list is selected or copied in this decision;
  independent curation uses the existing licensed pipeline and keeps teaching
  choices explicit.
- **Use every common JMdict entry.** Dictionary frequency and commonness do not
  define a beginner curriculum or a current JLPT level.
- **Author all definitions.** Duplicates the existing dictionary capability and
  creates unnecessary content-review work.

## Consequences and acceptance checks

No runtime code, dataset, storage, network call or dependency changes in this item.
Content remains bundled public text, validated at import time and rendered through
Svelte escaping. Guest learning and local progress export/import do not depend on
hosting or enabled accounts.

The next dataset item must validate unique stable IDs, valid source references,
selection-to-dataset equality, per-word selection provenance, required fields and
coverage categories, and taught-kana readings. Replace the current 30–50 beginner
set limit with explicit checks for the expanded manifest; preserve the first set's
coverage as a regression check. Do not merely remove its validation.

The later lesson item validates unique assignment and the ten-word limit. Search
and filtered lists remain separate roadmap items. Completion means coverage of
Onihayo's published inventory, not guaranteed coverage of every possible exam word.
Without listening, the first release must not claim complete JLPT exam readiness.
