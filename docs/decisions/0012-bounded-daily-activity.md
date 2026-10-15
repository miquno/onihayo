# 0012. Bounded daily answer counts for the activity heatmap

- Status: Accepted
- Date: 2026-10-14

## Context

The Progress page (0.16) shows what a learner has done. Everything on it so far is derived from the per-item records and lesson completions, which ADR 0008 keeps deliberately bounded: one record per item, "never an ever-growing log of answers".

An activity heatmap — one square per day, shaded by how much was practised — needs to know how many answers were given on each day. The records cannot provide that: an item's `firstSeen` and `lastSeen` say nothing about the days in between, and many items share a day. The same data would later support the optional calm streak from 0.16.

## Decision

- Progress document **version 4** adds `activity`: a list of `[day, count]` pairs. `day` is the learner-local calendar-day ordinal the scheduler already uses (ADR 0010); `count` is the number of answers given that day, 1 to 100,000.
- Only the **last 182 days** (26 weeks, the span the heatmap shows) are kept, counted back from the latest recorded day. Older days are dropped on every write and every read, so the list never holds more than 182 pairs (about 3 KB). Counting back from the latest recorded day, not the device clock, keeps a wrongly set clock from erasing recent history.
- Each saved answer in lessons, quizzes, and reviews increases its day's count by one. Nothing else is stored: no times of day, no item IDs per day, no typed answers.
- Version 3 documents migrate with an empty `activity`. Earlier activity cannot be reconstructed honestly, so it is not guessed from `lastSeen`.
- Merging guest and account progress keeps the larger count of a day, never the sum, because both sides may describe the same answers (the rule `merge.ts` already applies to answer counts).
- Validation rejects a day listed twice, a zero, fractional, or implausible count, and more than 182 pairs.

This refines, and does not replace, ADR 0008: the document stays bounded; the bound for this field is time-based instead of content-based.

## Alternatives considered

- **A log of answer timestamps.** Exact, but unbounded and far more revealing about when a learner studies. Rejected by ADR 0008.
- **Deriving activity from `lastSeen`.** Needs no new field, but shows at most one day per item and loses every earlier day of practice. It would be misleading.
- **A full year (371 days).** Matches common "contribution" calendars, but at 320 px wide its squares become about 4 px. Half a year stays readable on a phone; the window can grow later without a new version, since only the retention constant changes.

## Consequences

- The Privacy page states that daily answer counts for the last 26 weeks are stored.
- Older builds that meet a version 4 document ask the learner to reload instead of overwriting it (ADR 0008).
- Synced accounts store the same field inside their validated document; no database schema change is needed.
