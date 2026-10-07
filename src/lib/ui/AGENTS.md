# src/lib/ui/

The design system: tokens and shared, presentational components. Components render and delegate; learning logic lives in the domain modules. May not import `$lib/server`.

## Map

- `tokens.css` — design tokens as CSS custom properties: colors (light and dark), spacing, type scale and font stacks (including `--font-size-kana` for a single kana or kanji), border width and radius, disabled opacity, focus ring, and motion. Imported once by the root layout, before `app.css`.
- `tokens.test.ts` — checks every color pair against WCAG AA in both color schemes and that motion durations are zero under `prefers-reduced-motion`.
- `Button.svelte` — native `<button>` for actions; `variant` `primary` (default) or `secondary`; `type="button"` unless told otherwise; `disabled` supported.
- `LinkButton.svelte` — native `<a>` for navigation that looks like a button. `href` must come from `resolve()` in `$app/paths`, so links to missing routes fail the type check.
- `button.css` — styles shared by `Button` and `LinkButton`.
- `Card.svelte` — surface container for grouped content.
- `ProgressBar.svelte` — visible label and value text, `role="progressbar"` with `aria-valuenow`/`aria-valuetext`; the fill is drawn with SVG. Logic in `progress.ts` (clamping, value text).
- `VisuallyHidden.svelte` — text for screen readers only.
- `KanaPractice.svelte` — the practice used by lesson practice and the kana quiz: see one side of an item and type the other, or in a choice mode pick it from options (native buttons in a labelled group, from `choiceOptions()` over the page's `pool`, seeded per question with `optionSeed()`; after an answer the correct option and the learner's choice are marked by shape and hidden text, focus moves to "Next", then to the first option of the next question; while an option has focus, number keys choose and arrow keys, Home, and End move between the options, see `choice-keys.ts`; each option shows its number and carries `aria-keyshortcuts`). Feedback in a polite live region. The results show accuracy, time, and the missed items, most misses first, with "Retry mistakes" (a new session with only the missed items, each `retryRounds` times, in the same mode; shown only when there are mistakes) and "Practise again" (the whole practice in a new order). An `endless` session shows the question number and "Finish" instead of a progress bar. Instructions and the field label come from the items' own names ("Romaji for this katakana", "Hiragana for this romaji"); the field takes the solution's `lang`; and Enter that confirms an input-method composition never submits (`ime.ts`). Runs entirely in the browser on the session from `$lib/learning/session`, with questions built by a mode from `$lib/learning/modes` ("type the reading" unless the page passes another); the page supplies the practice items (`PracticeItem`s from `$lib/learning/practice-item`), question count, seed, and the result links as snippets. Helpers in `practice.ts`: `instructionsText()`, `answerLabel()`, `durationText()`, `optionSeed()`, `randomSeed()`, `resultText()`, `missesText()`, `missedItems()`, `lessonPractice()`.
- `choice-keys.ts` — keyboard support for options as pure logic: `choiceKeyAction(event, focused, count)` maps a keydown on an option to choosing an option (`1`–`9`, full-width digits too) or moving focus (arrow keys wrap, Home, End), and leaves everything else and any key with Alt, Ctrl, or Meta to the browser; `optionShortcut()` gives the `aria-keyshortcuts` value. The keys are handled on the option buttons only, so the single-key shortcuts apply only while an option has focus (WCAG 2.1.4).
- `KanaPractice.svelte` persists each submitted outcome through `$lib/progress` (item ID, correctness, and timestamp only); typed answer text is never saved. Lesson practice also records completion after every question has been answered.
- `ime.ts` — the input-method guard as pure logic: `ignoreNextSubmit(state, event)` follows keydown, keyup, compositionend, and submit and says whether a submit belongs to a composition (Chrome and Firefox report `isComposing`; Safari ends the composition first and marks the confirming Enter with keyCode 229, which `isImeKeydown()` reads through `imeKeydown(event)`). `ime.test.ts` replays each browser's event order.
- `LessonList.svelte` — the numbered list of a script's lessons, each linked with a preview of its kana (`lang="ja"`).
- `KanaLesson.svelte` — one kana lesson page for either script: title and position, the pronunciation note, each kana large with its romaji and note, an "Easy to mix up" section for look-alikes, a section per mark (ー, ッ) with example words, and the lesson navigation. The page supplies the hrefs (from `resolve()`), the link onwards, and a snippet for the end of the last lesson.
- `LessonPractice.svelte` — one lesson's practice page for either script: the h1, a `<noscript>` note, and `KanaPractice` with "Next lesson" (or all lessons after the last one) and "Back to the lesson". Its data comes from `lessonPractice()` in `practice.ts` (the lesson's kana as practice items from the kana adapter, each twice; `?seed=` replays an order; `undefined` for an unknown slug).
- `KanaCharts.svelte` — a script's charts from `kanaChart()`, one table per class with row and column headers and every kana `lang="ja"`; the page supplies the headings and a description snippet per class.
- `components.test.ts` — server-renders each component and checks roles, ARIA attributes, native elements, and that no inline `style` is emitted.

## Rules

- Use tokens, never raw values: no hex colors, pixel font sizes, or ad-hoc spacing in components or routes. A missing value is a new token.
- Colors are 6-digit hex and defined for light and dark mode. A new color token needs a contrast pair in `tokens.test.ts` (4.5:1 for text, 3:1 for focus rings, borders, and graphics); the test fails for an unpaired color.
- Animations and transitions use `--duration-*` tokens, so reduced motion turns them off.
- System fonts only. Web fonts or any font from another origin need a CSP and threat-model change.
- Japanese text carries `lang="ja"`; `app.css` gives it the Japanese font stack.
- Interactive components are native `<button>` and `<a>` elements, so keyboard operation comes from the browser. Never attach click handlers to non-interactive elements, and never remove the global `:focus-visible` ring.
- Components do not accept `class` or `style`: the look comes from props. Never emit inline `style` attributes (the CSP blocks them); draw dynamic sizes with SVG attributes or classes.
- Presentation logic (clamping, formatting) lives in a plain `.ts` module beside the component with its own unit test. Markup is tested by server rendering (`svelte/server`) in `components.test.ts`.
