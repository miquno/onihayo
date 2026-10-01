import { describe, expect, it } from 'vitest';
import { ignoreNextSubmit, isImeKeydown, type ImeEvent } from './ime';

const composingKey: ImeEvent = { type: 'keydown', isComposing: true, keyCode: 229 };
const safariConfirm: ImeEvent = { type: 'keydown', isComposing: false, keyCode: 229 };
const enter: ImeEvent = { type: 'keydown', isComposing: false, keyCode: 13 };
const letter: ImeEvent = { type: 'keydown', isComposing: false, keyCode: 75 };
const keyup: ImeEvent = { type: 'keyup' };
const compositionEnd: ImeEvent = { type: 'compositionend' };
const submit: ImeEvent = { type: 'submit' };

/** Runs the events in order and reports, for each submit, whether it was accepted. */
function acceptedSubmits(events: readonly ImeEvent[]): boolean[] {
  let ignoring = false;
  const accepted: boolean[] = [];
  for (const event of events) {
    if (event.type === 'submit') accepted.push(!ignoring);
    ignoring = ignoreNextSubmit(ignoring, event);
  }
  return accepted;
}

describe('isImeKeydown', () => {
  it('recognizes a key press during composition by isComposing or keyCode 229', () => {
    expect(isImeKeydown({ isComposing: true, keyCode: 229 })).toBe(true);
    expect(isImeKeydown({ isComposing: true, keyCode: 13 })).toBe(true);
    expect(isImeKeydown({ isComposing: false, keyCode: 229 })).toBe(true);
    expect(isImeKeydown({ isComposing: false, keyCode: 13 })).toBe(false);
  });
});

describe('ignoreNextSubmit', () => {
  it('accepts Enter typed without an input method', () => {
    expect(acceptedSubmits([letter, keyup, enter, submit, keyup])).toEqual([true]);
  });

  it('ignores a submit caused by the Enter that confirms a composition (Chrome, Firefox)', () => {
    // Composing "shi", then Enter to confirm: if the browser submits, it is ignored.
    expect(acceptedSubmits([composingKey, keyup, composingKey, submit, compositionEnd])).toEqual([
      false
    ]);
  });

  it('ignores it in Safari, where the composition ends before the confirming keydown', () => {
    expect(
      acceptedSubmits([composingKey, keyup, compositionEnd, safariConfirm, submit, keyup])
    ).toEqual([false]);
  });

  it('accepts the next real Enter after the composition is confirmed', () => {
    expect(
      acceptedSubmits([
        composingKey,
        keyup,
        composingKey,
        compositionEnd,
        keyup,
        enter,
        submit,
        keyup
      ])
    ).toEqual([true]);
    expect(
      acceptedSubmits([composingKey, compositionEnd, safariConfirm, submit, keyup, enter, submit])
    ).toEqual([false, true]);
  });

  it('accepts a click on Check while composing: losing focus ends the composition first', () => {
    expect(acceptedSubmits([composingKey, keyup, composingKey, compositionEnd, submit])).toEqual([
      true
    ]);
  });

  it('ignores at most one submit per confirming Enter', () => {
    expect(acceptedSubmits([composingKey, submit, submit])).toEqual([false, true]);
  });

  it('accepts a click on Check after a confirming Enter that did not submit (Safari)', () => {
    expect(acceptedSubmits([compositionEnd, safariConfirm, keyup, submit])).toEqual([true]);
  });
});
