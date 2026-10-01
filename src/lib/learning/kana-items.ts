import type { KanaLesson, KanaRecord } from '$lib/content/model';
import type { PracticeItem } from './practice-item';

/**
 * The kana adapter: a script's kana as practice items. The prompt is the kana,
 * the answer its romaji, and every alternative spelling is accepted. Asked the
 * other way round, every kana of the script that accepts the romaji is right
 * (ぢ as well as じ for "ji"). Options
 * for multiple-choice questions come from the same script, with the kana's
 * look-alikes (from the lessons' look-alike notes) first, then the rest of its
 * row.
 *
 * `records` is one script's whole dataset and `lessons` that script's lessons.
 * Items keep the dataset's order.
 */
export function kanaPracticeItems(
  records: readonly KanaRecord[],
  lessons: readonly KanaLesson[]
): PracticeItem[] {
  const lookAlikeSets = lessons.flatMap((lesson) =>
    (lesson.lookAlikes ?? []).map(({ kana }) => kana)
  );
  return records.map((record) => {
    const lookAlikes = unique(lookAlikeSets.filter((set) => set.includes(record.id)).flat()).filter(
      (id) => id !== record.id
    );
    const sameRow = records
      .filter((other) => other.row === record.row)
      .map((other) => other.id)
      .filter((id) => id !== record.id && !lookAlikes.includes(id));
    const sameReading = records
      .filter(
        (other) =>
          other.id !== record.id && [other.romaji, ...other.alternatives].includes(record.romaji)
      )
      .map((other) => other.character);
    const group = record.id.slice(0, record.id.lastIndexOf('.'));
    return {
      id: record.id,
      prompt: record.character,
      promptLang: 'ja',
      promptName: group.slice(group.indexOf('.') + 1),
      answer: record.romaji,
      answerLang: null,
      answerName: 'romaji',
      accepted: [record.romaji, ...record.alternatives],
      acceptedPrompts: [record.character, ...sameReading],
      choices: {
        group,
        preferred: [lookAlikes, sameRow].filter((tier) => tier.length > 0)
      }
    };
  });
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
