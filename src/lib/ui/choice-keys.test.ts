import { describe, expect, it } from 'vitest';
import { choiceKeyAction, optionShortcut, type ChoiceKey } from './choice-keys';

const press = (key: string, modifiers: Partial<ChoiceKey> = {}): ChoiceKey => ({
  key,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  ...modifiers
});

describe('choiceKeyAction', () => {
  it('chooses the option with the number pressed, wherever the focus is', () => {
    expect(choiceKeyAction(press('1'), 2, 4)).toEqual({ type: 'choose', index: 0 });
    expect(choiceKeyAction(press('4'), 0, 4)).toEqual({ type: 'choose', index: 3 });
  });

  it('ignores a number without an option, and 0', () => {
    expect(choiceKeyAction(press('5'), 0, 4)).toBeUndefined();
    expect(choiceKeyAction(press('3'), 0, 2)).toBeUndefined();
    expect(choiceKeyAction(press('0'), 0, 4)).toBeUndefined();
  });

  it('accepts full-width digits, as typed with a Japanese input method', () => {
    expect(choiceKeyAction(press('２'), 0, 4)).toEqual({ type: 'choose', index: 1 });
  });

  it('moves focus forwards with Right or Down and backwards with Left or Up, wrapping around', () => {
    expect(choiceKeyAction(press('ArrowRight'), 0, 4)).toEqual({ type: 'focus', index: 1 });
    expect(choiceKeyAction(press('ArrowDown'), 2, 4)).toEqual({ type: 'focus', index: 3 });
    expect(choiceKeyAction(press('ArrowRight'), 3, 4)).toEqual({ type: 'focus', index: 0 });
    expect(choiceKeyAction(press('ArrowLeft'), 2, 4)).toEqual({ type: 'focus', index: 1 });
    expect(choiceKeyAction(press('ArrowUp'), 0, 4)).toEqual({ type: 'focus', index: 3 });
  });

  it('moves focus to the first and last option with Home and End', () => {
    expect(choiceKeyAction(press('Home'), 2, 4)).toEqual({ type: 'focus', index: 0 });
    expect(choiceKeyAction(press('End'), 1, 4)).toEqual({ type: 'focus', index: 3 });
  });

  it('works with fewer options', () => {
    expect(choiceKeyAction(press('ArrowRight'), 1, 2)).toEqual({ type: 'focus', index: 0 });
    expect(choiceKeyAction(press('ArrowLeft'), 0, 1)).toEqual({ type: 'focus', index: 0 });
    expect(choiceKeyAction(press('1'), 0, 1)).toEqual({ type: 'choose', index: 0 });
    expect(choiceKeyAction(press('1'), 0, 0)).toBeUndefined();
  });

  it('leaves every other key to the browser', () => {
    for (const key of ['Enter', ' ', 'Tab', 'Escape', 'a', 'あ', 'F1', '12', '']) {
      expect(choiceKeyAction(press(key), 0, 4), key).toBeUndefined();
    }
  });

  it('leaves keys with Alt, Ctrl, or Meta to the browser, e.g. Ctrl+1 to switch tabs', () => {
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey'] as const) {
      expect(choiceKeyAction(press('1', { [modifier]: true }), 0, 4), modifier).toBeUndefined();
      expect(choiceKeyAction(press('ArrowLeft', { [modifier]: true }), 0, 4)).toBeUndefined();
    }
  });
});

describe('optionShortcut', () => {
  it('is the number key of the option, for the first nine', () => {
    expect([0, 1, 2, 3].map(optionShortcut)).toEqual(['1', '2', '3', '4']);
    expect(optionShortcut(8)).toBe('9');
    expect(optionShortcut(9)).toBeUndefined();
  });
});
