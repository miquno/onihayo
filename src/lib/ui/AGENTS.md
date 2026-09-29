# src/lib/ui/

The design system: tokens and shared, presentational components. Components render and delegate; learning logic lives in the domain modules. May not import `$lib/server`.

## Map

- `tokens.css` — design tokens as CSS custom properties: colors (light and dark), spacing, type scale and font stacks (including `--font-size-kana` for a single kana or kanji), radius, focus ring, and motion. Imported once by the root layout, before `app.css`.
- `tokens.test.ts` — checks every color pair against WCAG AA in both color schemes and that motion durations are zero under `prefers-reduced-motion`.

## Rules

- Use tokens, never raw values: no hex colors, pixel font sizes, or ad-hoc spacing in components or routes. A missing value is a new token.
- Colors are 6-digit hex and defined for light and dark mode. A new color token needs a contrast pair in `tokens.test.ts` (4.5:1 for text, 3:1 for focus rings, borders, and graphics); the test fails for an unpaired color.
- Animations and transitions use `--duration-*` tokens, so reduced motion turns them off.
- System fonts only. Web fonts or any font from another origin need a CSP and threat-model change.
- Japanese text carries `lang="ja"`; `app.css` gives it the Japanese font stack.
