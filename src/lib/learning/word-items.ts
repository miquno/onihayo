import type { WordRecord } from '$lib/content/model';
import { wordPrompt } from '$lib/content/words';
import { normalizeAnswer } from './normalize';
import type { PracticeItem } from './practice-item';
import type { QuestionMode } from './modes';

/** The two vocabulary directions used by the first word set. */
export const wordQuestionModes = [
  {
    id: 'word-meaning-to-reading',
    name: 'Type the reading',
    ask: 'prompt',
    respond: 'answer',
    input: 'type'
  },
  {
    id: 'word-reading-to-meaning',
    name: 'Choose the meaning',
    ask: 'answer',
    respond: 'prompt',
    input: 'choose'
  }
] as const satisfies readonly QuestionMode[];

/**
 * Adapt words into the shared practice contract; sessions remain content-agnostic. The prompt
 * is `wordPrompt()`: the first meanings and the word's usage hint, if `hints` has one.
 */
export function wordPracticeItems(
  records: readonly WordRecord[],
  hints: ReadonlyMap<string, string> = new Map()
): PracticeItem[] {
  return records.map((record) => {
    if (record.meanings.length === 0) throw new Error(`Word ${record.id} has no meaning.`);
    return {
      id: record.id,
      prompt: wordPrompt(record.meanings, hints.get(record.id)),
      promptLang: null,
      promptName: 'meaning',
      answer: record.kana,
      answerLang: 'ja',
      answerName: 'reading',
      accepted: [normalizeAnswer(record.kana)],
      acceptedPrompts: [...new Set(record.meanings.map(normalizeAnswer))],
      choices: { group: 'word', preferred: [] }
    };
  });
}
