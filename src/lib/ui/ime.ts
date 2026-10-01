/*
 * The input-method guard. With a Japanese input method (IME), the learner
 * types romaji, sees kana being composed, and presses Enter to confirm the
 * composition. That Enter must never submit the answer. Browsers differ in
 * what they report, so the guard follows the events of the answer field and
 * decides whether a submit belongs to a composition.
 *
 * - Chrome and Firefox: keydown has `isComposing` (and keyCode 229) while
 *   composing; `compositionend` follows the confirming Enter.
 * - Safari: `compositionend` comes first, then the confirming Enter as a
 *   keydown with keyCode 229 and `isComposing` false.
 */

/** What the guard needs from the events of the answer field and its form. */
export type ImeEvent =
  | { readonly type: 'keydown'; readonly isComposing: boolean; readonly keyCode: number }
  | { readonly type: 'keyup' | 'compositionend' | 'submit' };

/** The keyCode browsers report for a key press the input method handles. */
const imeKeyCode = 229;

/**
 * Whether a keydown belongs to an input-method composition. `keyCode` is
 * deprecated, but 229 is the only sign Safari gives for the confirming Enter,
 * and the check MDN recommends for ignoring composition key presses.
 */
export function isImeKeydown(event: {
  readonly isComposing: boolean;
  readonly keyCode: number;
}): boolean {
  return event.isComposing || event.keyCode === imeKeyCode;
}

/** A keydown as the guard sees it; pass the DOM event itself. */
export function imeKeydown(event: {
  readonly isComposing: boolean;
  readonly keyCode: number;
}): ImeEvent {
  return { type: 'keydown', isComposing: event.isComposing, keyCode: event.keyCode };
}

/**
 * The guard's state after `event`: whether the next submit must be ignored
 * because it comes from a key press that belongs to a composition. Call it
 * for every event in order, and ignore a submit while the state before it is
 * `true`.
 */
export function ignoreNextSubmit(ignoring: boolean, event: ImeEvent): boolean {
  switch (event.type) {
    case 'keydown':
      return isImeKeydown(event);
    // The key was released, the composition ended (also when the field loses
    // focus to a click on "Check"), or the submit was handled: the next
    // submit is a real one.
    case 'keyup':
    case 'compositionend':
    case 'submit':
      return false;
  }
}
