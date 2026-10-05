# 0010. JMdict as the source for Japanese-English vocabulary data

- Status: Accepted
- Date: 2026-10-05

## Context

Milestone 0.7 adds a small kana-only vocabulary set, and milestone 0.10 expands it. The source
register lists JMdict, maintained by the Electronic Dictionary Research and Development Group
(EDRDG), as a candidate. Before importing any entries, Onihayo needs a verified licence, an
attribution plan, a share-alike boundary, and a repository location for the licence text.

## Decision

- Use only JMdict's Japanese and English components for source-derived headwords, readings, English
  glosses, and parts-of-speech tags. The EDRDG licence statement lists these components under its
  licence; translations in other languages are covered by separate copyrights and are out of
  scope.
- Onihayo chooses its beginner words and lesson order independently. JMdict does not supply an N5
  vocabulary level, and its entries must not be represented as an official JLPT list.
- Treat all released JMdict-derived records and filtered data as CC BY-SA 4.0. Keep that data
  separate from application code, which remains MIT. The share-alike obligation applies to the
  source-derived data and adaptations, not to code that reads it.
- Store the vocabulary data and its licence text under `src/lib/content/vocabulary/`; the licence
  file will be `src/lib/content/vocabulary/LICENSE`. Add the source, release, retrieval date,
  checksum, transformations, and attribution to `docs/content/sources.md` when the first dataset is
  imported. No JMdict data is imported by this decision.
- Acknowledge JMdict and EDRDG on the Licences page and on each word page that displays JMdict-derived
  data. Link to the [JMdict project](https://www.edrdg.org/jmdict/j_jmdict.html), the
  [EDRDG licence statement](https://www.edrdg.org/edrdg/licence.html), and the
  [CC BY-SA 4.0 licence](https://creativecommons.org/licenses/by-sa/4.0/). The acknowledgement will
  credit EDRDG and state that the displayed data is used under its licence, without implying EDRDG
  endorses Onihayo.
- Review the latest JMdict release at least monthly and update the pinned input deliberately in a
  reviewed change. The import remains offline and deterministic; no automatic update bot is added.

The EDRDG licence statement says the Japanese and English JMdict components are available under
CC BY-SA 4.0. It requires attribution, share-alike for adapted material, and a procedure for regular
updates (at least monthly for web servers). It permits commercial use when its conditions are met;
donations are suggested when use produces financial return but are not a condition of use. This
decision relies on the current [EDRDG General Dictionary Licence Statement](https://www.edrdg.org/edrdg/licence.html),
which says it replaces previous licence statements, rather than older JMdict pages that refer to
earlier licence versions.

The word-page acknowledgement will read: “Some Onihayo vocabulary includes JMdict material from the
Electronic Dictionary Research and Development Group (EDRDG); its use follows the EDRDG licence.”
Link “JMdict” to the project page above and “EDRDG licence” to the licence statement.

## Consequences

- The JMdict-derived vocabulary data and its adaptations must be distributed under CC BY-SA 4.0.
  Keep attribution and licence links with every displayed JMdict-derived word record and in the
  site's general licence information.
- An imported release must be pinned and checksummed, and the import transformation documented and
  tested before data is committed, as required by `docs/content/README.md`.
- Onihayo-authored explanations and lesson material remain distinguishable from imported records.
  They do not change the MIT licence on application code.
- The source register records JMdict as selected but not yet in use. `NOTICE` and the Licences page
  will list it as a used dataset only when the first JMdict-derived data is added.

## Alternatives considered

- **Write every definition independently.** This avoids imported glosses but duplicates dictionary
  work and does not meet the roadmap's need for a reusable Japanese-English lexical source.
- **Use another or unlicensed word list.** The project prohibits sources with unclear terms, NC/ND
  restrictions, or no licence, and there is no evidence that another source meets the content and
  licence requirements better than JMdict.
