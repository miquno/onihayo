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
- `KanaPractice.svelte` — the kana practice used by lesson practice and the kana quiz: see a kana, type its romaji, feedback in a polite live region, Enter checks and moves on, a summary at the end with "Practise again". Runs entirely in the browser on the session from `$lib/learning/session`; the page supplies the kana, question count, seed, what to call a prompt (`kanaName`), and the result links as snippets. Helpers in `practice.ts`: `PracticeKana`, `practiceKana()` (a kana record with its accepted answers), `randomSeed()`, `resultText()`, `missesText()`, `missedItems()`.
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
