import type { WordRecord } from '$lib/content/model';
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

/** Adapt words into the shared practice contract; sessions remain content-agnostic. */
export function wordPracticeItems(records: readonly WordRecord[]): PracticeItem[] {
  return records.map((record) => {
    const [meaning] = record.meanings;
    if (meaning === undefined) throw new Error(`Word ${record.id} has no meaning.`);
    return {
      id: record.id,
      prompt: meaning,
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
