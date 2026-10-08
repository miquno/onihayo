# src/lib/srs/

Pure scheduling rules for reviewable learning items. This folder imports no Svelte or `$app/*` modules and performs no I/O.

`scheduler.ts` defines the pure Leitner transitions. `calendar.ts` converts explicit local calendar parts to day ordinals. The browser adapter lives in `src/lib/ui/scheduler-clock.ts`. `reviews.ts` selects due IDs from plain schedule candidates and applies the daily limit without depending on progress or retaining an answer log.

## Rules

- Inject both the current Unix time and local calendar-day ordinal through `SchedulerClock`; do not read `Date.now()`, `new Date()`, or `Math.random()` here.
- Keep state bounded to the current schedule. Never retain answer text or an unbounded review history.
- Keep all rating, interval, due-day, and mastery rules here and cover them with adjacent unit tests.
- Validate the scheduler's clock values and rating at the public function boundary.
- Keep due-review selection deterministic; count an item toward today's cap only after an actual review rating, not when its first schedule is created.
