import { describe, expect, it } from 'vitest';
import { words } from '$lib/content/word-lessons';
import { question, sessionItems } from './modes';
import { wordPracticeItems, wordQuestionModes } from './word-items';

describe('word practice adapter', () => {
  it('asks for a reading from a meaning and accepts the kana answer', () => {
    const [item] = wordPracticeItems(words);
    if (item === undefined) throw new Error('Expected the word dataset to contain an item.');
    expect(item).toMatchObject({
      id: 'word.jmdict.1002430',
      prompt: 'tea (esp. green or barley)',
      promptName: 'meaning',
      answer: 'おちゃ',
      answerLang: 'ja',
      answerName: 'reading',
      accepted: ['おちゃ']
    });
    expect(question(wordQuestionModes[0], item).accepted).toEqual(['おちゃ']);
    expect(sessionItems(wordQuestionModes[0], [item])).toEqual([
      { id: item.id, accepted: ['おちゃ'] }
    ]);
  });

  it('asks for a meaning from the reading and accepts the source glosses', () => {
    const word = words.find(({ id }) => id === 'word.jmdict.1002430');
    if (word === undefined) throw new Error('Expected the tea entry in the imported vocabulary.');
    const item = wordPracticeItems([word])[0];
    if (item === undefined) throw new Error('Expected the adapter to return the tea item.');
    expect(question(wordQuestionModes[1], item)).toMatchObject({
      shown: { text: 'おちゃ', lang: 'ja', name: 'reading' },
      solution: { text: 'tea (esp. green or barley)', lang: null, name: 'meaning' },
      accepted: ['tea (esp. green or barley)', 'tea break', 'teatime', 'tea ceremony']
    });
    expect(wordQuestionModes.map(({ id }) => id)).toEqual([
      'word-meaning-to-reading',
      'word-reading-to-meaning'
    ]);
  });
});
