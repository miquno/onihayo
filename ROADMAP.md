# Onihayo Roadmap

Onihayo's first product goal: **learn Japanese from absolute zero to JLPT N5 in one structured place**, so that a learner never has to wonder what to learn next.

```
Zero → Kana → Vocabulary → Kanji → Grammar → Reading / Listening → JLPT N5 readiness
```

## How this roadmap works

- Milestones are delivered in order. Each one leaves a working, deployable application and builds on the previous one.
- Every checklist item is one pull request (or a small, named series) that can be implemented and reviewed on its own. Items are ordered: the first unchecked item of the current milestone is the next task.
- An item is ticked only when its code, tests, and docs are merged and its acceptance criteria hold.
- Scope is JLPT N5. The data model may leave room for later levels, but no N4–N1 features are built.
- Changing the order or scope of a milestone is itself a reviewed change to this file.

Legend for "Required tests": **U** unit (Vitest), **I** integration (real PostgreSQL, from 0.9), **E** end-to-end/browser (Playwright), **A** accessibility (axe + keyboard), **D** dataset validation.

---

## 0.1 — Foundation ✅

**Goal:** a clean, secure, documented, and tested foundation that proves the stack works.
**User-visible result:** a single accessible landing page explaining that Onihayo is in early development.
**Prerequisites:** none.

- [x] Stack decision recorded with alternatives (ADR 0001): SvelteKit 2, Svelte 5, TypeScript 6 strict, adapter-node on Node 24, pnpm 10.
- [x] Application skeleton: landing page, root layout, base styles with light/dark and reduced-motion support, `/healthz` liveness endpoint.
- [x] Security headers on every SvelteKit response and a strict, nonce-based Content Security Policy; SvelteKit's CSRF origin check left on.
- [x] Tooling: Prettier, ESLint (strict type-checked, Svelte), `svelte-check`, Vitest, Playwright with axe.
- [x] Supply-chain settings: exact pins, committed lockfile, 7-day minimum release age, blocked install scripts, audit gate with reviewed exceptions.
- [x] CI: `checks`, `e2e`, `audit`, and `DCO` jobs with read-only permissions and SHA-pinned actions.
- [x] Governance: `AGENTS.md` (root and folder-local), `CLAUDE.md` pointers, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `LICENSE`, `NOTICE`, `CODEOWNERS`, issue and PR templates, `.env.example`, gitignored `scratch/`.
- [x] Documentation: architecture, learning model, data ownership, threat model, web security controls, authentication requirements, dependency policy, hosting model, content licensing rules and source register, ADRs 0001–0006.
- [x] Repository settings applied: ruleset for `main` (pull requests, required checks, squash only, no bypass), secret scanning with push protection, private vulnerability reporting, Dependabot alerts (alerts only), CodeQL default setup, read-only `GITHUB_TOKEN`. See `.github/AGENTS.md`.

**Acceptance criteria:** `pnpm verify` and `pnpm test:e2e` pass locally and in CI; the landing page has no axe violations in light and dark mode and no CSP violations.
**Required tests:** U (security headers hook, health endpoint), E + A (landing page, headers, 404, cross-origin form rejection, health).
**Security/privacy:** no cookies, no data stored, no third-party requests. Threat model v1.
**Content/licensing:** no learning content. Code licence MIT.

---

## 0.2 — Application shell and design system

**Goal:** an accessible, responsive shell and a small design system that every later feature plugs into; the site can be deployed publicly.
**User-visible result:** a consistent site with header, navigation, footer, About/Privacy/Licences pages, and friendly error pages, usable on phones and desktops, reachable at a public HTTPS address.
**Prerequisites:** 0.1.

- [x] Design tokens as CSS custom properties in `src/lib/ui/`: colors (light and dark), spacing scale, type scale with a Japanese-capable system font stack and a large display size for kana, radius, focus ring, and motion durations that become zero under `prefers-reduced-motion`.
- [x] Base components in `src/lib/ui/`: `Button` (primary/secondary, disabled state), `LinkButton`, `Card`, `ProgressBar` (with `role="progressbar"` and value text), `VisuallyHidden`. Each is keyboard operable with a visible focus ring.
- [x] Root layout: skip link to main content, `header` with site name and primary navigation, `main`, `footer`; per-route `<title>`; one `h1` per page; `aria-current` on the active navigation link.
- [x] Responsive layout without horizontal scrolling from 320 px to 1440 px wide, and at 200 % zoom.
- [x] Error handling: `+error.svelte` for 404 and unexpected errors with a way back home; `handleError` logs an error ID and route without request bodies or personal data, and shows the ID to the learner.
- [x] About page (what Onihayo is, the learning path from zero to N5) and Privacy page (what is stored: nothing; no cookies, tracking, or third parties).
- [x] Licences page listing the licences of third-party packages bundled into the production build, generated at build time from the build's module graph and checked against the lockfile.
- [x] Production container image: multi-stage `Dockerfile` (Node 24, `--frozen-lockfile`, non-root user, only `build/` and production files, `HEALTHCHECK` on `/healthz`); CI builds it on every pull request.
- [ ] Hosting ADR choosing the provider and region; first deployment to a public HTTPS domain with the proxy requirements from `docs/deployment/hosting.md` (**owner approval required**).

**Acceptance criteria:**

- Every route passes axe (WCAG 2.2 A/AA) in light and dark mode.
- All pages are fully usable with keyboard only; the skip link moves focus to `main`.
- No layout overflows at 320 px; text remains readable at 200 % zoom.
- Error pages never show stack traces or internal messages.
- The deployed site returns the documented security headers on HTML and static files and redirects HTTP to HTTPS.

**Required tests:** U (component logic where present; token contrast pairs meet WCAG AA), E + A (every route: axe light/dark, skip link, keyboard navigation, 404 page, viewport widths 320/768/1280), CI image build.
**Security/privacy:** error handling without leaks; static-file headers at the proxy; still no cookies or third-party requests; threat model updated with the hosting provider.
**Content/licensing:** licences page for bundled packages; no learning content yet.

---

## 0.3 — Hiragana learning

**Goal:** a complete beginner can learn and practise all hiragana, the first vertical slice of Learn → Practice.
**User-visible result:** "Start here" on the home page leads to hiragana lessons (one per row group) with each character's reading and a short pronunciation note, a practice quiz per lesson, and a hiragana chart.
**Prerequisites:** 0.2. ADR 0006 (content licence) decided.

- [x] Kana dataset in `src/lib/content/kana/`, authored for Onihayo: the 46 basic hiragana, 25 with dakuten/handakuten, and 33 yōon, each with a stable ID (e.g. `kana.hiragana.shi`), row, class, Hepburn romaji, and accepted alternatives (`si`, `tu`, …); every record marked `authored`.
- [x] Dataset validation tests: exact counts per class, unique IDs and characters, non-empty romaji, no duplicate alternatives, rows in gojūon order.
- [x] Answer normalization in `src/lib/learning/normalize.ts`: Unicode NFKC (full-width letters become ASCII), trim, lowercase; inner spaces kept.
- [x] Seedable random source in `src/lib/learning/random.ts` (small, well-known PRNG) with an interface the whole engine uses.
- [x] Practice session state machine in `src/lib/learning/session.ts`: asking → answered → next / finished; no immediate repeats when the pool has two or more items; records answers with timestamps from an injected clock.
- [x] Hiragana lesson pages: lesson list, per-lesson page showing each character large, its romaji, and an authored pronunciation note (per lesson, plus per character where it sounds different from its romaji); "Next lesson" link.
- [x] Lesson practice page, linked from each lesson page as "Practise this lesson": see a hiragana, type its romaji, instant feedback; after a miss the correct answer is shown and announced via a polite live region; Enter submits and advances; a summary at the end (accuracy, missed characters).
- [x] Hiragana chart page: all hiragana in a gojūon grid, marked up as a table with row and column headers, each character with `lang="ja"`.
- [x] Home page "Start here" call to action leading to the first hiragana lesson.
- [ ] Fluent-speaker review of the authored hiragana lesson notes, recorded in a pull request (**owner arranges the reviewer**).

**Acceptance criteria:**

- A learner with no prior knowledge can go from the home page through every hiragana lesson and its practice using only the keyboard or only a touch screen.
- Practice accepts all documented alternatives and rejects everything else; the same seed always yields the same question order.
- Screen readers announce feedback and read Japanese characters in Japanese.

**Required tests:** D (kana dataset), U (normalization incl. full-width and whitespace cases; random source determinism; session transitions, no immediate repeats, summary maths), E + A (lesson → practice → summary journey, chart table semantics).
**Security/privacy:** practice runs in the browser; nothing is stored or sent. Content rendered as text only.
**Content/licensing:** Onihayo-authored kana data and notes under the ADR 0006 licence; fluent-speaker review of pronunciation notes.

---

## 0.4 — Katakana learning

**Goal:** the same learning experience for katakana, reusing 0.3's content model and session.
**User-visible result:** katakana lessons, practice, and chart; mixed hiragana/katakana practice.
**Prerequisites:** 0.3.

- [x] Katakana characters added to the kana dataset for all 104 sounds, with IDs `kana.katakana.<sound>`.
- [x] Kana quiz: pick any rows of hiragana and katakana from a grid of row tiles (an "All" switch per group that shows a partial selection, the selected count always visible, starting with nothing selected prevented with an explanation) and practise them together through the shared practice component and session; the selection travels in the URL.
- [x] Extended katakana needed by N5 loanwords as a separate class (ティ, ディ, ファ, フィ, フェ, フォ, ウィ, ウェ, ウォ, シェ, ジェ, チェ) with validation tests.
- [x] Katakana lessons with authored notes, including the long-vowel mark ー and small ッ.
- [x] Look-alike notes for commonly confused pairs (シ/ツ, ソ/ン, ク/ケ, …) shown in the relevant lessons.
- [x] Katakana practice and chart pages reusing the 0.3 components and session without copying them.

**Acceptance criteria:** same as 0.3 for katakana; no katakana-specific branches in session logic.
**Required tests:** D (katakana inventory, extended class), U (mixed pools), E + A (katakana lesson → practice journey).
**Security/privacy:** unchanged.
**Content/licensing:** authored; speaker review.

---

## 0.5 — Shared practice engine ✅

**Goal:** one practice engine with several question modes that any content type can use.
**User-visible result:** a practice setup page where learners pick kana sets and a mode — type the reading, choose the reading, choose the character, or type the kana — with results and "retry mistakes".
**Prerequisites:** 0.4.

- [x] Practice item contract in `src/lib/learning/`: the data a question needs (ID, prompt, accepted answers, choice candidates, `lang`), produced by a per-content adapter; kana is the first adapter.
- [x] Question modes as data: type-the-reading, choose-the-reading, choose-the-character. Adding a mode adds a mode definition and tests, not a new session code path.
- [x] Distractor selection: same script, look-alikes and same row first, never duplicates, exactly one correct option, deterministic for a seed.
- [x] Type-the-kana mode: the prompt shows romaji and the learner types kana with their OS input method; Enter during IME composition never submits; answers compared after NFKC normalization.
- [x] Practice setup page: choose scripts, lessons/rows, mode, and length (10, 20, 50, endless); selection count always visible; starting with nothing selected is prevented with an explanation.
- [x] Choice keyboard support: number keys 1–4 select options; arrow keys move between options; focus management after each question.
- [x] Results: accuracy, time, missed items ordered by misses; "Practise again" and "Retry mistakes".

**Acceptance criteria:** every mode is fully keyboard operable and screen-reader announced; the engine has no kana-specific code outside the kana adapter.
**Required tests:** U (each mode, distractor rules incl. small pools, IME composition guard as pure logic, results maths), E + A (setup → session → results in two modes).
**Security/privacy:** setup state lives in the URL or memory; nothing stored yet.
**Content/licensing:** look-alike groupings authored.

---

## 0.6 — Progress model

**Goal:** learners' progress survives visits, and the site always knows what comes next.
**User-visible result:** completed lessons are marked; the home page shows "Continue: <next lesson>"; Settings lets learners export, import, and reset their progress.
**Prerequisites:** 0.5.

- [x] ADR: guest progress storage (IndexedDB vs `localStorage`), schema versioning, and migration of stored data; ADR choosing the single validation library (e.g. Zod) used at all boundaries.
- [x] Progress record per item keyed by stable ID: stage (new / learning / reviewing / mastered), attempts, correct count, first and last seen; lesson completion records.
- [x] Stage transition rules in one pure, tested function (`src/lib/progress/`).
- [x] Storage adapter that validates everything it reads: unknown IDs dropped, corrupted data recovered with a visible notice, never a crash; writes are versioned.
- [x] Practice results update progress; lessons are marked complete after their practice.
- [x] Home page "Continue" action: exactly one primary next step.
- [x] Settings page: export progress to a JSON file, import with validation and a size limit, reset with explicit confirmation.
- [x] Privacy page updated: what is stored in the browser, that clearing browser data deletes it, and how to export.

**Acceptance criteria:** progress persists across reloads; a corrupted or hand-edited store never breaks the site; an export can be imported into a fresh browser and yields identical progress.
**Required tests:** U (stage transitions, next-step selection, storage parsing with corrupted/unknown/oversized input, export/import round trip, schema migration), E + A (complete a lesson → reload → continue; export/import; reset).
**Security/privacy:** browser storage is a new trust boundary (B5): stored data is untrusted input and never rendered as HTML. No server storage, no cookies. Threat model updated.
**Content/licensing:** none.

---

## 0.7 — Vocabulary foundation

**Goal:** vocabulary becomes a first-class item type with a licensed data pipeline and a first small word set written in kana.
**User-visible result:** a first vocabulary unit (around 30–50 beginner words written in kana) with lessons, practice, and word pages.
**Prerequisites:** 0.6.

- [x] ADR and register entry for the vocabulary source (JMdict/EDRDG): licence verified from the publisher, attribution text, share-alike handling, and repository location of the licence.
- [x] Import script in `scripts/content/` that reads a pinned, checksum-verified JMdict release and emits a compact dataset limited to Onihayo's selection list; transformations documented; the output is committed, the script is re-runnable.
- [x] Word item model: stable ID, kana, optional kanji forms, English meanings, part of speech, source entry reference, origin (`imported`/`authored`).
- [x] First word set: an Onihayo-authored selection of kana-only beginner words, grouped into lessons.
- [x] Word adapter for the practice engine: meaning → reading and reading → meaning modes.
- [x] Word lesson and word detail pages (`/words/[id]`).
- [x] Attribution added to `NOTICE` and the Licences page.

**Acceptance criteria:** all vocabulary data traces back to a pinned source and a documented transformation; words only use kana the learner has been taught.
**Required tests:** D (word dataset: IDs, required fields, origins, only taught kana), U (import transformation on a fixture, word adapter), E + A (word lesson → practice).
**Security/privacy:** import runs offline in development/CI, never at request time.
**Content/licensing:** first imported dataset (CC BY-SA 4.0, to verify); share-alike obligations documented.

---

## 0.8 — SRS and review engine

**Goal:** learned items come back for review at the right time, across kana and vocabulary.
**User-visible result:** a Reviews page with the number of due reviews, calm review sessions mixing kana and words, and the home page putting due reviews before new lessons.
**Prerequisites:** 0.7.

- [x] ADR: scheduling algorithm (evaluate FSRS via a maintained library vs. a simple SM-2/Leitner variant), rating model, and the "mastered" threshold.
- [x] Scheduler in `src/lib/srs/`: pure, clock-injected, with due calculation that respects the learner's local day boundary.
- [x] Items enter the review schedule after their lesson practice.
- [x] Review session using the practice engine; answers map to scheduler ratings.
- [x] Daily review cap and new-lesson pacing settings with calm defaults; no penalties for missed days.
- [x] Progress storage migration adding scheduling state.
- [ ] Home page next-step logic: due reviews, otherwise next lesson.

**Acceptance criteria:** scheduling is reproducible in tests; skipping days never produces an unbounded backlog beyond the cap; storage migration preserves 0.6 progress.
**Required tests:** U (intervals, lapses, due dates across time zones and DST changes, cap, migration), E + A (review session journey).
**Security/privacy:** still local-only.
**Content/licensing:** scheduling library licence checked if one is added.

---

## 0.9 — Accounts and sync (optional accounts)

**Goal:** learners can optionally create an account to sync and back up progress across devices; guests keep full access.
**User-visible result:** sign up, sign in, sign out, verify email, recover access, sync progress, export data, and delete the account.
**Prerequisites:** 0.8. Requirements in `docs/security/authentication.md`.

- [ ] ADR: authentication library, credential method(s), session strategy, email provider, and rate-limiting approach, measured against `docs/security/authentication.md`.
- [ ] PostgreSQL + Drizzle: schema in `src/lib/server/db/`, committed migrations in `drizzle/`, separate migration and application roles, Docker Compose database for local development, `.env.example` updated.
- [ ] CI integration-test job with a PostgreSQL service container.
- [ ] Sign-up, sign-in, sign-out with secure `__Host-` session cookies, session rotation, and expiry.
- [ ] Email verification and account recovery with single-use, hashed, short-lived tokens and enumeration-safe responses.
- [ ] Rate limiting on all authentication endpoints per IP and per account.
- [ ] Progress sync: server as source of truth when signed in; explicit upload/merge of guest progress on sign-up.
- [ ] Per-user authorization in every data-access function, with cross-user integration tests.
- [ ] Account deletion (immediate, cascading, all sessions revoked) and JSON data export.
- [ ] Deployment: managed PostgreSQL, migration release step, backups with point-in-time recovery; privacy page, threat model, web security table, and hosting doc updated; re-review the `cookie` audit exception.

**Acceptance criteria:** guests are unaffected; no endpoint lets one user read or change another user's data; responses do not reveal whether an email is registered; deleting an account removes all its rows.
**Required tests:** U (validation, merge logic), I (auth flows, session expiry/rotation, rate limits, cross-user isolation, deletion cascade, migrations apply cleanly to an empty database), E + A (sign up → sync → sign in elsewhere → delete).
**Security/privacy:** new boundaries B7–B9; first personal data (email); first cookies; new third party (email provider). Full threat-model update and review before release.
**Content/licensing:** none.

---

## 0.10 — JLPT N5 vocabulary

**Goal:** the full N5 vocabulary, taught in small themed lessons and reviewed through the SRS.
**User-visible result:** complete N5 vocabulary lessons, a searchable word list, and word pages.
**Prerequisites:** 0.9 (so progress on hundreds of items is protected), 0.7.

- [ ] ADR: source and licence of the N5 word list (verified community list or Onihayo-curated list), recorded in the source register.
- [ ] N5 word dataset imported/selected with the 0.7 pipeline; every word tagged with its N5 list source.
- [ ] Themed lessons of at most 10 words, ordered by usefulness; kanji forms shown as optional until kanji are taught.
- [ ] Word search by kana, romaji, and English meaning (server-rendered results, works without JavaScript).
- [ ] Word list page with filters (learned / not learned) and pagination.

**Acceptance criteria:** every N5 word appears in exactly one lesson; search results are correct for kana, romaji, and English queries.
**Required tests:** D (coverage against the chosen list, lesson sizes, uniqueness), U (search normalization and ranking), E + A (search, word list, lesson).
**Security/privacy:** search input validated and length-limited; no query logging.
**Content/licensing:** attribution for the list source and JMdict.

---

## 0.11 — JLPT N5 kanji

**Goal:** the N5 kanji with meanings, readings, stroke order, and links to known words.
**User-visible result:** kanji lessons, kanji practice and reviews, kanji pages with stroke-order diagrams, and kanji search.
**Prerequisites:** 0.10.

- [ ] Register entries and licence verification for KANJIDIC2 and KanjiVG; N5 kanji list source decided (ADR).
- [ ] Import script for the N5 kanji subset (meanings, on/kun readings, stroke count) and KanjiVG stroke data; validation tests.
- [ ] Kanji lessons that introduce each kanji with example words the learner already knows.
- [ ] Kanji practice modes (meaning, reading) through the shared engine; kanji enter reviews.
- [ ] Kanji detail pages with stroke-order diagrams rendered from local SVG data, with a text alternative.
- [ ] Words switch to showing their kanji forms once all their kanji are learned (with furigana).

**Acceptance criteria:** every N5 kanji has at least one meaning, one reading, stroke data, and one known example word.
**Required tests:** D (kanji dataset, stroke data presence), U (kanji adapter, "all kanji learned" rule), E + A (kanji lesson → practice, detail page).
**Security/privacy:** SVGs are generated at import time and rendered as trusted local data, never from user input.
**Content/licensing:** CC BY-SA datasets (to verify); share-alike for derived SVGs.

---

## 0.12 — JLPT N5 grammar

**Goal:** the N5 grammar points explained simply, with examples built from known words and kanji.
**User-visible result:** grammar lessons with explanations, examples with furigana and translations, and grammar practice.
**Prerequisites:** 0.11.

- [ ] N5 grammar inventory defined in `docs/content/` (particles, copula, verb and adjective forms, common patterns) and agreed before writing.
- [ ] Grammar point model: stable ID, title, pattern, explanation, examples, related words and kanji.
- [ ] Onihayo-authored explanations and example sentences, written and speaker-reviewed in batches (one pull request per batch).
- [ ] Grammar practice mode: choose the correct particle or form in a sentence, through the shared engine.
- [ ] Grammar reference page listing all points.

**Acceptance criteria:** every example sentence uses only words, kanji, and grammar introduced earlier (validated).
**Required tests:** D (grammar dataset, example sentences only use known items), U (grammar question generation), E + A (grammar lesson → practice).
**Security/privacy:** unchanged.
**Content/licensing:** authored; any Tatoeba sentence carries per-sentence attribution.

---

## 0.13 — Guided learning path

**Goal:** one clear path from zero to N5 that interleaves kana, vocabulary, kanji, grammar, and reviews.
**User-visible result:** a Path page showing units and progress, and a home page that always offers exactly one next step.
**Prerequisites:** 0.12.

- [ ] Path model in `src/lib/content/path/`: ordered units with steps (lesson, practice, review checkpoint, reading) referencing item and lesson IDs.
- [ ] Path validation tests: every step only depends on items introduced earlier; every N5 item appears on the path.
- [ ] Path overview page with unit completion.
- [ ] "Today" home: due reviews first, otherwise the next path step; one primary action.
- [ ] Kana placement check that lets learners who already know kana skip ahead.

**Acceptance criteria:** a new learner following only the primary action covers all N5 content in path order.
**Required tests:** D (path prerequisites), U (next-step selection), E + A (new learner journey across the first units).
**Security/privacy:** unchanged.
**Content/licensing:** path ordering is authored.

---

## 0.14 — Reading exercises

**Goal:** short reading texts that use only what the learner has been taught.
**User-visible result:** graded short readings with furigana toggle, word glosses on demand, and comprehension questions.
**Prerequisites:** 0.13.

- [ ] Reading model and authored texts placed at path checkpoints.
- [ ] Validation that each text uses only items introduced before its path position.
- [ ] Reading page with ruby furigana, a furigana toggle, and accessible word-gloss popovers.
- [ ] Comprehension questions through the shared engine.

**Acceptance criteria:** readings are understandable using only taught items; glosses work with keyboard and screen readers.
**Required tests:** D (reading vocabulary coverage), U (tokenization against known items), E + A (reading page, gloss popover).
**Security/privacy:** unchanged.
**Content/licensing:** authored; speaker review.

---

## 0.15 — Listening exercises

**Goal:** listening practice from single kana to short dialogues.
**User-visible result:** kana listening, word listening, and short dialogues with transcripts.
**Prerequisites:** 0.14.

- [ ] ADR: audio source and licence (recordings, Commons, TTS, or browser speech synthesis); register entry.
- [ ] Audio files self-hosted and served with long cache lifetimes; CSP `media-src 'self'` unchanged.
- [ ] Kana listening mode (hear a sound → choose the kana).
- [ ] Word listening mode.
- [ ] Short dialogues with always-available transcripts and comprehension questions.
- [ ] Keyboard-accessible playback controls; no autoplay.

**Acceptance criteria:** every audio exercise has a transcript alternative; no third-party audio origins.
**Required tests:** D (every audio file exists and is referenced), U (listening mode), E + A (listening journey without autoplay).
**Security/privacy:** no new origins; if TTS is generated at build time, the engine's terms are recorded.
**Content/licensing:** audio licence and attribution documented.

---

## 0.16 — Progress and statistics

**Goal:** calm, honest insight into progress and readiness.
**User-visible result:** a Progress page with items per stage, accuracy over time, a review forecast, an optional streak, and an N5 readiness indicator.
**Prerequisites:** 0.15.

- [ ] Statistics derived from recorded progress only (no duplicate counters).
- [ ] Items per stage per content type; accuracy over time.
- [ ] Review forecast for the next 7 days.
- [ ] Optional, calm streak (days practised) that can be hidden; no loss-aversion messaging.
- [ ] N5 readiness indicator per category with a clear explanation of how it is computed.
- [ ] Every chart has an equivalent data table.

**Acceptance criteria:** statistics are consistent with recorded progress; charts are accessible without seeing them.
**Required tests:** U (all statistics calculations, streaks across time zones), E + A (progress page, table alternatives).
**Security/privacy:** statistics computed from the learner's own data; nothing shared.
**Content/licensing:** none.

---

## 0.17 — Security, accessibility, and performance hardening

**Goal:** prove the whole application is safe, accessible, and fast before 1.0.
**User-visible result:** fewer rough edges; faster pages; verified accessibility.
**Prerequisites:** 0.16.

- [ ] OWASP ASVS Level 1 self-assessment documented in `docs/security/`, findings fixed or recorded.
- [ ] Manual screen-reader audit (NVDA + Firefox, VoiceOver + Safari) of every journey; findings fixed.
- [ ] Performance budgets (JavaScript per route, Largest Contentful Paint on a mid-range phone) measured and enforced in CI.
- [ ] Cross-browser E2E for critical journeys in Firefox and WebKit.
- [ ] Backup restore drill performed and documented.
- [ ] Evaluate Trusted Types (`require-trusted-types-for 'script'`) and CSP violation reporting; adopt or record why not.
- [ ] Dependency review: remove unused packages, update deliberately.

**Acceptance criteria:** no open high-severity findings; all budgets met; restore drill succeeded.
**Required tests:** E (multi-browser), A (full route coverage), performance checks in CI.
**Security/privacy:** full threat-model review.
**Content/licensing:** full attribution audit of the Licences page against `NOTICE` and the source register.

---

## 1.0 — Zero-to-N5 release

**Goal:** a complete, reviewed path from zero to JLPT N5.
**User-visible result:** the public 1.0 release.
**Prerequisites:** 0.17.

- [ ] All N5 content complete and reviewed by a fluent speaker.
- [ ] Release process: version tags, changelog release section, deploy and rollback runbook.
- [ ] Final privacy notice and Licences page.
- [ ] Launch checklist executed (headers, backups, monitoring, rate limits, error pages).

**Acceptance criteria:** a new learner can follow the path from the home page to N5 readiness without leaving Onihayo.
**Required tests:** full suite green; manual release checklist.
**Security/privacy:** final threat-model sign-off.
**Content/licensing:** every source attributed; licences verified.
