import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { importSelectedWords, readPinnedJmdictArchive } from './import';

const fixture = `<?xml version="1.0"?>
<!DOCTYPE JMdict [<!ENTITY n "noun">]>
<JMdict created="2026-10-07" version="1.10">
  <entry><ent_seq>100</ent_seq><k_ele><keb>猫</keb></k_ele><r_ele><reb>ねこ</reb></r_ele><sense><pos>&n;</pos><gloss xml:lang="eng">cat</gloss></sense></entry>
  <entry><ent_seq>200</ent_seq><r_ele><reb>みず</reb></r_ele><sense><pos>&n;</pos><gloss>water &amp; ice &amp;lt;script</gloss></sense></entry>
  <entry><ent_seq>300</ent_seq><k_ele><keb>野菜</keb></k_ele><k_ele><keb>埜菜</keb></k_ele><r_ele><reb>やさい</reb></r_ele><r_ele><reb>ヤサイ</reb><re_nokanji/></r_ele><r_ele><reb>のな</reb><re_restr>埜菜</re_restr></r_ele><sense><pos>&n;</pos><gloss>vegetable</gloss></sense><sense><misc>slang</misc><gloss>marijuana</gloss></sense><sense><gloss>greens</gloss><gloss xml:lang="ger">Gemüse</gloss></sense></entry>
</JMdict>`;

const pick = (sequence: number, choice: { reading?: string; senses?: number[] } = {}) => ({
  sequence,
  category: 'food',
  rationale: 'test',
  ...choice
});

describe('JMdict import pipeline', () => {
  it('emits only selected words with normalized source fields and stable references', () => {
    expect(importSelectedWords(fixture, [pick(200)], 'onihayo.n5.v1')).toEqual([
      {
        id: 'word.jmdict.200',
        kana: 'みず',
        meanings: ['water & ice &lt;script'],
        partOfSpeech: ['noun'],
        sourceEntry: { source: 'JMdict', sequence: 200 },
        selection: 'onihayo.n5.v1',
        origin: 'imported'
      }
    ]);
  });

  it('teaches only the first sense unless the selection names others', () => {
    const [first] = importSelectedWords(fixture, [pick(300)], 'onihayo.n5.v1');
    expect(first?.meanings).toEqual(['vegetable']);
    const [chosen] = importSelectedWords(fixture, [pick(300, { senses: [3, 1] })], 'onihayo.n5.v1');
    // English glosses only; later senses inherit the parts of speech stated before them.
    expect(chosen?.meanings).toEqual(['greens', 'vegetable']);
    expect(chosen?.partOfSpeech).toEqual(['noun']);
    expect(() => importSelectedWords(fixture, [pick(300, { senses: [9] })], 'x')).toThrow(
      /no sense 9/
    );
  });

  it('teaches a selected reading with only the written forms that reading allows', () => {
    const select = (reading: string) =>
      importSelectedWords(fixture, [pick(300, { reading })], 'onihayo.n5.v1')[0];
    expect(select('やさい')).toMatchObject({ kana: 'やさい', kanji: ['野菜', '埜菜'] });
    expect(select('ヤサイ')).toMatchObject({ kana: 'ヤサイ' });
    expect(select('ヤサイ')).not.toHaveProperty('kanji');
    expect(select('のな')).toMatchObject({ kana: 'のな', kanji: ['埜菜'] });
    expect(() => select('あお')).toThrow(/no reading あお/);
  });

  it('preserves multiple kanji forms and rejects missing or duplicate entries', () => {
    const withVariants = fixture.replace('<keb>猫</keb>', '<keb>猫</keb><keb>ねこ</keb>');
    expect(importSelectedWords(withVariants, [pick(100)], 'x')[0]?.kanji).toEqual(['猫', 'ねこ']);
    expect(() => importSelectedWords(fixture, [pick(400)], 'x')).toThrow(/not found: 400/);
    expect(() =>
      importSelectedWords(
        fixture.replace('</JMdict>', '<entry><ent_seq>100</ent_seq></entry></JMdict>'),
        [pick(100)],
        'x'
      )
    ).toThrow(/more than once/);
    expect(() =>
      importSelectedWords(fixture.replace('<reb>みず</reb>', ''), [pick(200)], 'x')
    ).toThrow(/no reading/);
  });

  it('rejects an unpinned compressed archive before import', () => {
    const archive = gzipSync(fixture);
    const digest = createHash('sha256').update(archive).digest('hex');
    expect(() => readPinnedJmdictArchive(archive)).toThrow(/checksum mismatch/);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(() => readPinnedJmdictArchive(Buffer.from('not a gzip archive'))).toThrow();
  });
});
