import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import * as v from 'valibot';
import type { WordRecord } from '../../../src/lib/content/model.ts';
import { jmdictSource } from './source.ts';

const sequenceSchema = v.pipe(v.number(), v.integer(), v.minValue(1));

/** Validate a selection list before it is used to filter the publisher's data. */
export function parseSelection(input: unknown): readonly number[] {
  const selection = v.parse(v.array(sequenceSchema), input);
  if (new Set(selection).size !== selection.length) {
    throw new Error('JMdict selection contains duplicate entry sequence numbers.');
  }
  return selection;
}

/** Verify the compressed source and its embedded release metadata before parsing any entries. */
export function readPinnedJmdictArchive(archive: Uint8Array): string {
  const actualHash = createHash('sha256').update(archive).digest('hex');
  if (actualHash !== jmdictSource.sha256) {
    throw new Error(
      `JMdict archive checksum mismatch: expected ${jmdictSource.sha256}, received ${actualHash}.`
    );
  }

  const xml = gunzipSync(archive).toString('utf8');
  const root = xml.match(/<JMdict\s+created="([0-9-]+)"\s+version="([0-9.]+)"\s*>/);
  if (root?.[1] !== jmdictSource.release || root[2] !== jmdictSource.version) {
    throw new Error('JMdict archive metadata does not match the pinned release.');
  }
  return xml;
}

function decodeXmlText(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .replace(/&#([0-9]+);/g, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10))
    )
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function textValues(xml: string, tag: string): string[] {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'g');
  return [...xml.matchAll(pattern)]
    .map((match) => {
      const inner = match[1];
      if (inner === undefined) throw new Error(`JMdict ${tag} element is malformed.`);
      const raw = inner
        .replace(/<[^>]+>/g, '')
        .replace(/&([A-Za-z][A-Za-z0-9-]*);/g, (entity, name: string) =>
          ['amp', 'lt', 'gt', 'quot', 'apos'].includes(name) ? entity : name
        );
      return decodeXmlText(raw.trim());
    })
    .filter(Boolean);
}

function recordFromEntry(entry: string, sequence: number): WordRecord {
  const readings = textValues(entry, 'reb');
  const [kana] = readings;
  const meanings = [...new Set(textValues(entry, 'gloss'))];
  if (!kana || meanings.length === 0) {
    throw new Error(`JMdict entry ${String(sequence)} has no reading or English meaning.`);
  }

  const kanji = [...new Set(textValues(entry, 'keb'))];
  const partOfSpeech = [...new Set(textValues(entry, 'pos'))];
  return {
    id: `word.jmdict.${String(sequence)}`,
    kana,
    ...(kanji.length > 0 ? { kanji } : {}),
    meanings,
    partOfSpeech,
    sourceEntry: { source: 'JMdict', sequence },
    origin: 'imported'
  };
}

/** Extract only selected JMdict sequence numbers, preserving source-defined order. */
export function importSelectedWords(
  xml: string,
  selection: readonly number[]
): readonly WordRecord[] {
  const selected = new Set(selection);
  const found = new Map<number, WordRecord>();
  const rootStart = xml.search(/<JMdict\b[^>]*>/);
  const rootEnd = xml.lastIndexOf('</JMdict>');
  if (rootStart < 0 || rootEnd < rootStart)
    throw new Error('JMdict XML root is missing or incomplete.');

  const body = xml.slice(rootStart, rootEnd).replace(/<!--[\s\S]*?-->/g, '');
  for (const match of body.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/g)) {
    const entry = match[1];
    if (entry === undefined) throw new Error('JMdict entry is malformed.');
    const sequenceText = textValues(entry, 'ent_seq')[0];
    if (!sequenceText || !/^[1-9][0-9]*$/.test(sequenceText)) {
      throw new Error('JMdict entry has an invalid sequence number.');
    }
    const sequence = Number(sequenceText);
    if (!selected.has(sequence)) continue;
    if (found.has(sequence))
      throw new Error(`JMdict entry ${String(sequence)} occurs more than once.`);
    found.set(sequence, recordFromEntry(entry, sequence));
  }

  const missing = selection.filter((sequence) => !found.has(sequence));
  if (missing.length > 0)
    throw new Error(`Selected JMdict entries not found: ${missing.join(', ')}.`);
  return [...found.values()];
}

export interface ImportedWordDataset {
  readonly provenance: { readonly source: string; readonly licence: string };
  readonly release: string;
  readonly sha256: string;
  readonly entries: readonly WordRecord[];
}

/** The compact, deterministic dataset shape written by the CLI. */
export function createDataset(entries: readonly WordRecord[]): ImportedWordDataset {
  return {
    provenance: { source: jmdictSource.source, licence: jmdictSource.licence },
    release: jmdictSource.release,
    sha256: jmdictSource.sha256,
    entries
  };
}
