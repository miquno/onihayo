/*
 * Keyboard support for the options of a multiple-choice question, as pure
 * logic. The keys only apply while an option has focus, so the single-key
 * shortcuts never fire while the learner is somewhere else on the page
 * (WCAG 2.1.4, Character Key Shortcuts).
 */

/** What a key press on an option does. */
export type ChoiceKeyAction =
  | { readonly type: 'choose'; readonly index: number }
  | { readonly type: 'focus'; readonly index: number };

/** What the handler needs from a keydown; pass the DOM event itself. */
export interface ChoiceKey {
  readonly key: string;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
}

/**
 * The action for a key pressed while the option at `focused` has focus, among
 * `count` options, or `undefined` when the key is not one of ours:
 *
 * - `1` … `9` choose that option, if there is one (full-width digits too);
 * - the arrow keys move focus to the next or previous option and wrap around;
 * - Home and End move focus to the first and last option.
 *
 * Keys pressed with Alt, Ctrl, or Meta are left to the browser.
 */
export function choiceKeyAction(
  event: ChoiceKey,
  focused: number,
  count: number
): ChoiceKeyAction | undefined {
  if (count < 1 || event.altKey || event.ctrlKey || event.metaKey) return undefined;

  const key = event.key.normalize('NFKC');
  if (/^[1-9]$/u.test(key)) {
    const index = Number(key) - 1;
    return index < count ? { type: 'choose', index } : undefined;
  }
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return { type: 'focus', index: (focused + 1) % count };
    case 'ArrowLeft':
    case 'ArrowUp':
      return { type: 'focus', index: (focused - 1 + count) % count };
    case 'Home':
      return { type: 'focus', index: 0 };
    case 'End':
      return { type: 'focus', index: count - 1 };
    default:
      return undefined;
  }
}

/** The value of `aria-keyshortcuts` for the option at `index`, or `undefined` beyond 9 options. */
export function optionShortcut(index: number): string | undefined {
  return index < 9 ? String(index + 1) : undefined;
}
