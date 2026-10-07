import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { importSelectedWords, parseSelection, readPinnedJmdictArchive } from './import';

const fixture = `<?xml version="1.0"?>
<!DOCTYPE JMdict [<!ENTITY n "noun">]>
<JMdict created="2026-10-07" version="1.10">
  <entry><ent_seq>100</ent_seq><k_ele><keb>猫</keb></k_ele><r_ele><reb>ねこ</reb></r_ele><sense><pos>&n;</pos><gloss xml:lang="eng">cat</gloss></sense></entry>
  <entry><ent_seq>200</ent_seq><r_ele><reb>みず</reb></r_ele><sense><pos>&n;</pos><gloss>water &amp; ice &amp;lt;script</gloss></sense></entry>
</JMdict>`;

describe('JMdict import pipeline', () => {
  it('validates unique positive sequence selections', () => {
    expect(parseSelection([100, 200])).toEqual([100, 200]);
    expect(() => parseSelection([100, 100])).toThrow(/duplicate/);
    expect(() => parseSelection(['100'])).toThrow();
    expect(() => parseSelection([0])).toThrow();
  });

  it('emits only selected words with normalized source fields and stable references', () => {
    expect(importSelectedWords(fixture, [200])).toEqual([
      {
        id: 'word.jmdict.200',
        kana: 'みず',
        meanings: ['water & ice &lt;script'],
        partOfSpeech: ['noun'],
        sourceEntry: { source: 'JMdict', sequence: 200 },
        origin: 'imported'
      }
    ]);
  });

  it('preserves multiple kanji forms and rejects missing or duplicate entries', () => {
    const withVariants = fixture.replace('<keb>猫</keb>', '<keb>猫</keb><keb>ねこ</keb>');
    expect(importSelectedWords(withVariants, [100])[0]?.kanji).toEqual(['猫', 'ねこ']);
    expect(() => importSelectedWords(fixture, [300])).toThrow(/not found/);
    expect(() =>
      importSelectedWords(
        fixture.replace('</JMdict>', '<entry><ent_seq>100</ent_seq></entry></JMdict>'),
        [100]
      )
    ).toThrow(/more than once/);
    expect(() => importSelectedWords(fixture.replace('<reb>みず</reb>', ''), [200])).toThrow(
      /no reading/
    );
  });

  it('rejects an unpinned compressed archive before import', () => {
    const archive = gzipSync(fixture);
    const digest = createHash('sha256').update(archive).digest('hex');
    expect(() => readPinnedJmdictArchive(archive)).toThrow(/checksum mismatch/);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(() => readPinnedJmdictArchive(Buffer.from('not a gzip archive'))).toThrow();
  });
});
