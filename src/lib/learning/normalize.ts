/**
 * Brings a typed answer into the form content is stored in, so that answers
 * and accepted spellings can be compared with `===`.
 *
 * 1. Unicode NFKC: full-width letters (ｋａ) and the ideographic space become
 *    ASCII, half-width katakana (ｶﾞ) becomes full-width (ガ), and a kana
 *    followed by a combining dakuten (か + U+3099) becomes the precomposed が.
 * 2. Trim leading and trailing whitespace.
 * 3. Lowercase.
 *
 * Inner whitespace is kept as typed: `"ka ka"` is not `"kaka"`.
 */
export function normalizeAnswer(answer: string): string {
  return answer.normalize('NFKC').trim().toLowerCase();
}
