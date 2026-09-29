# 0006. Code and content licensing

- Status: Proposed — the repository owner decides before the first Onihayo-authored content is merged (milestone 0.3)
- Date: 2026-09-29

## Context

Onihayo will contain three kinds of material: source code, Onihayo-authored educational content (explanations, mnemonics, example sentences, exercises), and imported third-party datasets (for example EDRDG's JMdict and KANJIDIC2, which are CC BY-SA 4.0). Share-alike data licences apply to the data and its derivatives, not to the code that reads it.

## Proposal

- **Code:** MIT (already in `LICENSE`), matching the maintainer's other projects.
- **Onihayo-authored content:** one of
  - (a) MIT, like the code — simplest; or
  - (b) CC BY-SA 4.0 — the conventional licence for educational text, and compatible with the share-alike datasets the content will sit beside.
    Recommendation: **(b)**, stated in a `LICENSE` file inside each authored-content directory.
- **Imported data:** keeps its original licence, stored in its own directory with the licence text, listed in `NOTICE`, `docs/content/sources.md`, and the site's licences page.
- Sources with **NonCommercial** or **NoDerivatives** terms are not used, so the project stays free to be hosted by anyone, including with donations or paid hosting.

## Consequences

- Contributors must know which licence applies to what they add; `CONTRIBUTING.md` and folder-local `AGENTS.md` files state it.
