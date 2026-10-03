# src/lib/progress/

Learner progress: what one learner knows about each item and which lessons they have completed. Plain TypeScript: imports neither `svelte` nor `$app/*`, does no I/O, and depends only on `src/lib/content/` and `src/lib/learning/` types (`ARCHITECTURE.md`). Storage and its rules are decided in [ADR 0008](../../../docs/decisions/0008-guest-progress-storage.md); nothing here reads or writes browser storage yet.

## Map

- `stages.ts` — `stages` and `Stage` (new, learning, reviewing, mastered, in order) and the stage rules: `nextStage(stage, correct)`, the stage of an item after one answer, read from one table of transitions. A correct answer moves one stage forward as far as reviewing, a wrong answer one stage back but never to new, and no answer leads to mastered. `stages.test.ts` pins every transition and checks those rules over runs of answers.
- `records.ts` — the progress model as immutable values. `ProgressRecord`: what a learner knows about one item (`stage`, `attempts`, `correct`, `firstSeen`, `lastSeen`). `LessonCompletion`: when a lesson was first completed. `LearnerProgress`: both, as maps keyed by item ID and lesson ID. `emptyProgress()`; `stageOf()` (an item without a record is `new`); `recordAnswer()` (counts one answer of a practice session in its item's record, creating the record with the first answer; takes an `AnsweredItem`, a session's `AnswerRecord` without the typed text; moves the item to the stage `nextStage()` gives); `completeLesson()` (keeps the earliest completion, and returns the same progress when nothing changes). `records.test.ts` checks the counts, that answers give the same counts and times in any order, that the stage follows `nextStage()`, and that an update never changes the progress it was given.

## Rules

- Records are keyed by the stable IDs of the content (`kana.hiragana.shi`, `lesson.hiragana.ka`) and nothing else. No content-type specific fields or branches: kana, words, kanji, and grammar points share one record (`docs/architecture/learning-model.md`).
- Stage rules live in `nextStage()` and nowhere else: a new rule is a change to its table and its tests, never a condition in a component, a route, or another module. Keep `docs/architecture/learning-model.md` in step with the table.
- Progress is an immutable value. An update returns a new `LearnerProgress` and never changes the one it was given.
- Deterministic: times are arguments, in whole milliseconds since the Unix epoch from an injected clock. Never read `Date.now()` or `new Date()` here.
- Bounded data only: one record per item and per lesson, never a growing log of answers, and never the text a learner typed (ADR 0008).
- A record keeps its invariants through every update: `correct` is never more than `attempts`, and `firstSeen` is never after `lastSeen`, even when answers arrive out of order or the device's clock was set back.
- Records live in `Map`s, so an ID such as `__proto__` or `constructor` is an ordinary key. Do not turn them into plain objects indexed by an ID.
- Stored progress is untrusted input (trust boundary B5). Code that reads it validates it first and never renders a stored string as HTML.
- Unit tests sit beside the code as `*.test.ts`.
