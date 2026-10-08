# src/lib/srs/

Pure scheduling rules for reviewable learning items. This folder imports no Svelte or `$app/*` modules and performs no I/O.

## Rules

- Inject both the current Unix time and local calendar-day ordinal through `SchedulerClock`; do not read `Date.now()`, `new Date()`, or `Math.random()` here.
- Keep state bounded to the current schedule. Never retain answer text or an unbounded review history.
- Keep all rating, interval, due-day, and mastery rules here and cover them with adjacent unit tests.
- Validate the scheduler's clock values and rating at the public function boundary.
