# Learning content: provenance and licensing

Correct, legally clean content is as important as working code. This page is the rule set; [sources.md](sources.md) is the register of sources and open questions.

## Never

- Copy content from Nihondex, WaniKani, Bunpro, commercial textbooks (Genki, Minna no Nihongo, …), paid dictionaries, or commercial learning apps — including explanations, mnemonics, example sentences, item orderings, and audio.
- Scrape learning websites, even if the content is publicly visible.
- Use sources licensed NonCommercial (NC) or NoDerivatives (ND), or with no licence at all.
- Generate content with tools whose terms forbid this use, or present generated content as reviewed when it is not.

## Three kinds of content

Every content record states its origin:

| Origin      | Meaning                                                                   | Examples                                               |
| ----------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `imported`  | Taken from a third-party dataset under its licence, possibly transformed. | JMdict glosses, KANJIDIC2 readings                     |
| `generated` | Derived mechanically by an Onihayo script from other data.                | Romaji produced from kana by a rule table              |
| `authored`  | Written for Onihayo by a contributor.                                     | Lesson explanations, mnemonics, most example sentences |

Authored Japanese is reviewed by a fluent speaker before release; the review is noted in the pull request.

## Importing a dataset — checklist

Before any file from a third-party source enters the repository:

1. **Identify the source**: publisher, URL, exact release/version, download date, and checksum.
2. **Verify the licence** from the publisher's own licence page, not from a mirror or a package README.
3. **Document the licence** in [sources.md](sources.md) and keep the licence text next to the data.
4. **Document the required attribution** and add it to `NOTICE` and the site's licences page.
5. **Document the transformations** (filtering, field mapping, normalization) in the import script and in sources.md. The script lives in `scripts/content/` and is deterministic.
6. **Add validation tests**: counts, unique stable IDs, required fields, allowed values, no unexpected characters, and that every record carries its origin.

A pull request that imports data without all six steps is not merged.

## Licences

Code is MIT. The licence for Onihayo-authored content is proposed in [ADR 0006](../decisions/0006-code-and-content-licensing.md) and must be decided before the first authored content is merged. Imported data keeps its own licence.
