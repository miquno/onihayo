# JMdict import

The importer is offline. Download the JMdict English-only Next Generation archive from the EDRDG
publisher at the URL and release date in `source.ts`; verify the SHA-256 matches the pin, then run:

```sh
pnpm content:jmdict -- /path/to/JMdict_e_NG.gz
```

It verifies the compressed archive's SHA-256 and the XML creation date and version before reading
entries. It emits only the entry sequence numbers in `selection.json`, in source order. The
selection is empty until the separate first-word-set roadmap item is selected, so the checked-in
dataset currently contains provenance and no imported entries. The CLI accepts the selection and
output paths as optional second and third arguments. When entries are selected, the
transformation keeps the first Japanese reading, available written forms, English glosses, and
part-of-speech codes; it assigns `word.jmdict.<sequence>` IDs and retains the JMdict sequence as the
source reference. It does not infer JLPT level or author teaching order.

The selected JMdict-derived dataset and its transformations are licensed CC BY-SA 4.0 under ADR
0010; the licence text is in `src/lib/content/vocabulary/LICENSE`. The source archive is not
committed while no vocabulary has been selected. The selection file, checksum pin, fixtures, and
generated output make filtering deterministic. Review and update the pinned release deliberately
at least monthly to follow the EDRDG licence's update condition.

## Parser dependency

The offline tool uses `fast-xml-parser` 5.11.2 (MIT, development-only; about 1.4 MiB, never shipped
to learners). JMdict uses DTD-defined entities and nested XML records; a hand-written regular
expression parser risks corrupting entity values and tag boundaries. The parser is actively
maintained ([project releases](https://github.com/NaturalIntelligence/fast-xml-parser/releases))
and keeps entity size, count, expansion depth, total expansions, and expanded text bounded for this
source format.
