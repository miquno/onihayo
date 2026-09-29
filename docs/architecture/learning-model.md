# Learning model

Onihayo teaches kana, vocabulary, kanji, and grammar as **one system**. This document defines the shared concepts that every feature builds on. It is a design target: each concept is implemented by the roadmap milestone noted beside it, not before.

## Concepts

| Concept              | Meaning                                                                                                                                                                                   | Introduced              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Item**             | One learnable thing: a kana, a word, a kanji, or a grammar point. Has a stable ID such as `kana.hiragana.ka`, `word.<id>`, `kanji.<id>`, `grammar.<id>`. IDs are never renamed or reused. | 0.3                     |
| **Lesson**           | A small, ordered group of items taught together (for example one kana row, or ten words), with Onihayo-authored explanations.                                                             | 0.3                     |
| **Practice session** | A sequence of questions over a set of items, driven by a question mode (type the reading, choose the character, …). Produces answers; never mutates content.                              | 0.3, generalized in 0.5 |
| **Question mode**    | A data-driven way to ask about an item. Adding a mode must not require a new session code path.                                                                                           | 0.5                     |
| **Progress record**  | What one learner knows about one item: stage, attempts, last seen, and (from 0.8) review scheduling state. Keyed by item ID.                                                              | 0.6                     |
| **Review**           | A scheduled practice of previously learned items when they are due.                                                                                                                       | 0.8                     |
| **Path**             | The ordered sequence of units and steps (lesson → practice → review → reading/listening) from zero to N5.                                                                                 | 0.13                    |

## Stages: Learn → Practice → Review → Master

Every item moves through the same stages regardless of its type:

1. **New** — not yet introduced.
2. **Learning** — introduced in a lesson; being practised.
3. **Reviewing** — in the review schedule.
4. **Mastered** — recalled reliably over long intervals (threshold defined with the scheduler in 0.8).

A wrong answer can move an item back; the rules live in one tested function, never in UI components.

## Principles

- **Nothing unexplained.** A question never asks about an item the learner has not been taught in a lesson, and example material only uses items introduced earlier on the path (checked by content validation tests from 0.13).
- **One next step.** The home screen always offers exactly one primary next action: due reviews first, otherwise the next lesson.
- **Deterministic logic.** Selection, scheduling, and grading take an injected random source and clock, so tests are reproducible.
- **Calm.** No penalties for breaks, no loss-aversion streak mechanics, no artificial scarcity.
- **Content-type specifics are data.** Kanji have readings, grammar points have patterns — but session, progress, and review code handles all items the same way.
