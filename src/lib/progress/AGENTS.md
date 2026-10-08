# src/lib/progress/

Learner progress: what one learner knows about each learning item and which lessons they have completed. The model and storage adapter are plain TypeScript: they import neither `svelte` nor `$app/*`, and storage is passed in so the adapter can be tested in Node (`ARCHITECTURE.md`). Storage rules are decided in [ADR 0008](../../../docs/decisions/0008-guest-progress-storage.md).

## Map

- `stages.ts` — `stages` and `Stage` (new, learning, reviewing, mastered, in order) and the stage rules: `nextStage(stage, correct)`, the stage of an item after one answer, read from one table of transitions. A correct answer moves one stage forward as far as reviewing, a wrong answer one stage back but never to new, and no answer leads to mastered. `stages.test.ts` pins every transition and checks those rules over runs of answers.
- `records.ts` — immutable progress records, lesson completions, and `ProgressSettings`; `recordAnswer()` stores counts and correctness only; `completeLessonPractice()` completes a lesson and starts schedules for its practised items once; `recordReview()` applies a scheduler rating and updates mastery; `setProgressSettings()` validates and stores bounded local preferences. `records.test.ts` covers updates, scheduling, settings, and immutability.
- `pacing.ts` — `lessonsCompletedToday()` counts lesson completions on the learner's current local day using the injected scheduler clock.
- `next-step.ts` — `nextLessonToLearn()` selects the first incomplete lesson in the fixed hiragana-then-katakana order; the home page uses this single choice for Continue.
- `context.ts` — the type and symbol key for the progress state shared by the root layout, home page, practice, and Settings; the layout owns the per-page state and initializes it with one validated storage read.
- `storage.ts` — the `localStorage` adapter. `readProgress()` validates bounded version 1, 2, and 3 documents with Valibot; v1 gains an empty review schedule, v2 keeps schedules, and both migrate to v3 with default preferences. It converts only IDs known to current content into `Map`s, quarantines malformed data, and returns a notice instead of throwing. `updateProgress()` re-reads the latest document before applying a change and preserves unknown IDs when writing. Export/import includes local settings; import validates before replacement.

## Rules

- Records are keyed by the stable IDs of the content (`kana.hiragana.shi`, `lesson.hiragana.ka`) and nothing else. No content-type specific fields or branches: kana, words, kanji, and grammar points share one record (`docs/architecture/learning-model.md`).
- Stage rules live in `nextStage()` and nowhere else: a new rule is a change to its table and its tests, never a condition in a component, a route, or another module. Keep `docs/architecture/learning-model.md` in step with the table.
- Progress is an immutable value. An update returns a new `LearnerProgress` and never changes the one it was given.
- Deterministic: times are arguments, in whole milliseconds since the Unix epoch from an injected clock. Never read `Date.now()` or `new Date()` here.
- Bounded data only: one record per item and per lesson, never a growing log of answers, and never the text a learner typed (ADR 0008).
- A record keeps its invariants through every update: `correct` is never more than `attempts`, and `firstSeen` is never after `lastSeen`, even when answers arrive out of order or the device's clock was set back.
- Records live in `Map`s, so an ID such as `__proto__` or `constructor` is an ordinary key. Do not turn them into plain objects indexed by an ID.
- Stored progress is untrusted input (trust boundary B5). Code that reads it validates it first and never renders a stored string as HTML.
- The storage shape is versioned. Released schemas do not change; a new shape needs a new version and migration tests. Version 2 adds nullable item schedules; version 3 adds bounded daily review and new-lesson pace preferences. Migrations preserve schedules and give older learners calm defaults. Never overwrite a document whose version is newer than the running code.
- Unit tests sit beside the code as `*.test.ts`.
