# JMdict import

The importer is offline. Download the JMdict English-only Next Generation archive from the EDRDG
publisher at the URL and release date in `source.ts`; verify the SHA-256 matches the pin, then run:

```sh
pnpm content:jmdict /path/to/JMdict_e_NG.gz
```

It verifies the compressed archive's SHA-256 and the XML creation date and version before reading
entries. It emits only the entries listed in the selection manifest
`src/lib/content/vocabulary/selection.json` (Onihayo's authored `onihayo.n5.v1` selection), in
source order. The CLI accepts the manifest and output paths as optional second and third
arguments. For each entry the transformation keeps:

- the reading the manifest names in `reading`, or the entry's first reading;
- the written forms that reading allows (`re_restr`), or none for a kana-only reading (`re_nokanji`);
- the English glosses of the senses the manifest names in `senses` (1-based, in that order), or of
  the first sense only, so learners are not taught every dictionary sense;
- the parts of speech of those senses (a sense without its own inherits them from the sense
  before, as JMdict specifies).

It assigns `word.jmdict.<sequence>` IDs, retains the JMdict sequence as the source reference, and
tags every word and the dataset with the selection ID. It does not infer JLPT level or author
teaching order. Onihayo-authored lesson grouping and notes are stored separately in
`src/lib/content/vocabulary/lessons.json`.

The selected JMdict-derived dataset and its transformations are licensed CC BY-SA 4.0 under ADR
0010; the licence text is in `src/lib/content/vocabulary/LICENSE`. The source archive is not
committed; the selection file, checksum pin, fixtures, and generated output make filtering
deterministic. Review and update the pinned release deliberately at least monthly to follow the
EDRDG licence's update condition.

## Parser dependency

The offline tool uses `fast-xml-parser` 5.11.2 (MIT, development-only; about 1.4 MiB, never shipped
to learners). JMdict uses DTD-defined entities and nested XML records; a hand-written regular
expression parser risks corrupting entity values and tag boundaries. The parser is actively
maintained ([project releases](https://github.com/NaturalIntelligence/fast-xml-parser/releases))
and keeps entity size, count, expansion depth, total expansions, and expanded text bounded for this
source format.
