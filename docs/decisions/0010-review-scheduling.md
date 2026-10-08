# 0010. A small, local-day Leitner scheduler

- Status: Accepted
- Date: 2026-10-08

## Context

Milestone 0.8 needs deterministic review dates, a learner rating model, and a point at which an item becomes mastered. The scheduler must run in the browser and Node, fit the local-only progress model, and avoid collecting a review log.

## Decision

- Use a five-box Leitner schedule with intervals of 1, 3, 7, 14, and 30 local calendar days.
- Ratings are `again`, `hard`, `good`, and `easy`. `Again` returns to box one and resets the successful-review streak. `Hard` keeps the current box and increments the streak. `Good` advances one box; `Easy` advances two boxes. All ratings other than `Again` count as successful reviews.
- An item is mastered after at least five consecutive successful reviews and reaching the 30-day box. `Again` removes mastery by resetting the streak.
- A newly scheduled item starts at box one, due on the next local calendar day.
- The injected scheduler clock supplies both Unix milliseconds and a local calendar-day ordinal. Scheduling stores the ordinal, not a UTC timestamp, so daylight-saving transitions do not shift the learner's intended local review day. The browser adapter derives the ordinal from the learner's local calendar; domain code does not read the system clock or timezone.
- The schedule is bounded state on each progress record; no answer history is retained.
- Add no dependency. FSRS is a more adaptive model with four ratings and a TypeScript implementation (`ts-fsrs`), but its benefit depends on review history and its model/state is larger than this beginner product needs today. Onihayo deliberately avoids retaining that history. A small local implementation is straightforward to test and migrate; revisit FSRS if evidence from learners justifies its additional model and state.

## Alternatives considered

- **FSRS via `ts-fsrs`.** A maintained TypeScript toolkit implementing FSRS is available from the Open Spaced Repetition project. FSRS models difficulty, stability, and retrievability and uses four grades. Its richer state and value are not justified before Onihayo has review data or needs personalized optimization. The package is MIT licensed, but adding it would increase the shipped dependency surface.
- **SM-2.** Widely used, but its ease factor and interval calculations are more state and tuning than needed for the initial N5 review slice.
- **Fixed daily review.** Simpler, but does not space recalled items out or provide a clear mastery threshold.

## Consequences

- Scheduling is reproducible and testable with an injected clock and explicit local-day ordinal.
- The five interval boxes are a deliberate, easy-to-explain starting point rather than a claim of individually optimal intervals.
- Progress schema version 2 adds a nullable schedule to each item; version 1 records migrate with no schedule. Scheduling is added after lesson practice in a later 0.8 item.
- No new security boundary is introduced. Schedule data remains bounded and local to the learner's browser.

## References

- [Open Spaced Repetition `ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs)
- [FSRS algorithm overview](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)
