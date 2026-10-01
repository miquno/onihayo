# 0008. Guest progress in `localStorage` as one versioned document

- Status: Accepted
- Date: 2026-10-01

## Context

From milestone 0.6 a guest's progress has to survive between visits while the server stores nothing ([ADR 0002](0002-guest-first-learning.md)). The browser offers two realistic places for it: `localStorage` and IndexedDB.

What we store is small and bounded: one progress record per learning item, lesson completions, settings, and from 0.8 the review scheduling state of each item. An upper-bound document for the whole N5 scope (1,260 items with scheduling state, 250 lessons) measured 332,000 characters, about 6 % of the 5 MiB that browsers give `localStorage` per origin, and took under 1 ms to parse or to serialize in Node 26 on a development laptop.

Neither mechanism is more durable than the other. Both are best-effort storage: the browser may clear them under storage pressure, the learner clears them with the site's data, and Safari deletes all script-written storage of a site after seven days of browser use without interaction with it ([MDN: storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [WebKit: 7-day cap on script-writable storage](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).

Whatever is stored is untrusted input when it is read back (trust boundary B5 in the [threat model](../security/threat-model.md)): learners edit it by hand, other tabs and older versions of Onihayo write it, and it can be cut off or missing.

## Decision

**Mechanism**

- Guest progress is stored in `localStorage` under the single key `onihayo:progress`, as one JSON document.
- Only one module reads and writes that key: the storage adapter in `src/lib/progress/`. It takes the storage object (`getItem`, `setItem`, `removeItem`) as an argument, like the clock and the random source elsewhere, so it is unit-tested in Node and imports neither `svelte` nor `$app/*`.
- The document holds bounded data only: records keyed by stable item or lesson ID, and settings. It never holds an ever-growing log of answers.

**Schema versioning**

- The document has a top-level `version`: a positive integer, starting at `1`. Every change to the stored shape increases it by one, including an added field.
- Each version has its own schema, written with the validation library ([ADR 0009](0009-validation-library.md)). A schema that has been released is never edited; a new shape is a new version.
- The exported progress file (Settings, 0.6) is this same document. Import and reading from storage therefore share one schema, one validation, and one migration path; an import additionally checks the file size before parsing.

**Migration of stored data**

- A migration is a pure function from version _n_ to version _n + 1_. Migrations are kept and applied in order on read, so a document of any released version becomes the current one. Each has a unit test with a stored document of its source version as a fixture.
- A migrated document is written back at once. If that write fails, the visit continues with the migrated progress in memory.
- A document with a **newer** version than the running code knows (an old tab after a deployment, or a file exported from a newer Onihayo) is left exactly as it is: not migrated down, not overwritten. The learner sees a notice asking them to reload; an import of such a file is refused with a message.

**Reading untrusted data**

- Every read ends in a valid in-memory progress value. No stored string is rendered as HTML.
- Text that is not JSON, or a document that fails its version's schema, is treated as corrupted: the raw text is moved to `onihayo:progress.rejected` (one copy, replacing any earlier one), progress starts empty, and the learner sees a notice. The site keeps working.
- A record for an item or lesson ID that the running build does not know is not corruption. It is left out of the in-memory progress.
- When storage cannot be read or written at all (disabled site data, quota exceeded), the site keeps working with progress held in memory for the visit, and says so.

**More than one tab**

- A write re-reads the stored document and applies its change to that, instead of writing back what the tab loaded earlier. Other tabs follow through the `storage` event.

This ADR does not define the fields of a progress record, the stage rules, or the Settings page; those are the next items of milestone 0.6.

## Alternatives considered

- **IndexedDB.** Asynchronous, transactional, and able to hold far more than 5 MiB. None of that is needed for a few hundred kilobytes that are read once per page and written after an answer. It would cost an event-based API with more failure states (blocked upgrades, version-change events, aborted transactions), asynchronous loading before any progress can be shown, and either a wrapper library shipped to every learner or hand-written plumbing. Unit tests in Node would need a new development dependency that fakes IndexedDB. Its durability is the same as `localStorage`.
- **One `localStorage` key per item.** Smaller writes, but no single snapshot: versioning, migration, export, and recovery would each have to walk and reconcile hundreds of keys, and a half-written state becomes possible.
- **A cookie.** Sent to the server with every request, limited to about 4 KB, and contrary to ADR 0002: the server sets no cookies for guests.
- **`sessionStorage`.** Lost when the tab closes.

## Consequences

- The server never sees progress. Pages are server-rendered without it and show progress-dependent parts (completed marks, "Continue") once the browser has read the document; those parts need a sensible server-rendered default and must not shift the layout.
- Reads and writes are synchronous. At the measured size this is well below a frame; the size estimate is a budget. If a feature needs unbounded history, or the estimate for the full document passes 1 MB, a new ADR revisits IndexedDB. The adapter is the only code that would change, plus one migration that moves the data.
- Storage can disappear (Safari's seven-day rule, cleared site data, storage pressure). The Privacy and Settings pages say so and offer export, as ADR 0002 requires. Asking the browser for persistent storage is not part of this decision.
- A tab that still runs an older build may not know item IDs that a newer build has stored. The storage adapter item must make sure such a tab does not delete those records when it writes.
- Any script running on the origin, and browser extensions, can read and change the document; the strict Content Security Policy remains the mitigation. The document contains learning history and settings, no identifiers, and never leaves the browser.
- When the adapter lands, boundary B5 becomes active: the threat model, the Privacy page, [data-ownership.md](../architecture/data-ownership.md), and the storage check in `tests/e2e/layout.spec.ts` change in that pull request.
