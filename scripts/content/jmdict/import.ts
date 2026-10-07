import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { XMLParser } from 'fast-xml-parser';
import * as v from 'valibot';
import type { WordRecord } from '../../../src/lib/content/model.ts';
import { jmdictSource } from './source.ts';

const sequenceSchema = v.pipe(v.number(), v.integer(), v.minValue(1));
const parser = new XMLParser({
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
  parseTagValue: false,
  processEntities: {
    maxEntitySize: 10_000,
    maxExpansionDepth: 10,
    maxTotalExpansions: 1_000_000,
    maxExpandedLength: 10_000_000,
    maxEntityCount: 1_000
  }
});

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

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('JMdict XML contains an unexpected object shape.');
  }
  return value as Record<string, unknown>;
}

function asRecordOrEmpty(value: unknown): Record<string, unknown> {
  return value === '' ? {} : asRecord(value);
}

function asArray(value: unknown): readonly unknown[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function textContent(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return '';
  const text = asRecord(value)['#text'];
  return typeof text === 'string' ? text.trim() : '';
}

function directTextValues(parent: Record<string, unknown>, childName: string): string[] {
  return asArray(parent[childName]).map(textContent).filter(Boolean);
}

function entrySequence(entry: Record<string, unknown>): number {
  const sequence = textContent(entry.ent_seq);
  if (!/^[1-9][0-9]*$/.test(sequence)) {
    throw new Error('JMdict entry has an invalid sequence number.');
  }
  const value = Number(sequence);
  if (!Number.isSafeInteger(value))
    throw new Error('JMdict entry sequence exceeds the safe integer range.');
  return value;
}

function recordFromEntry(entry: Record<string, unknown>, sequence: number): WordRecord {
  const readings = asArray(entry.r_ele).flatMap((value) =>
    directTextValues(asRecordOrEmpty(value), 'reb')
  );
  const [kana] = readings;
  const kanji = [
    ...new Set(
      asArray(entry.k_ele).flatMap((value) => directTextValues(asRecordOrEmpty(value), 'keb'))
    )
  ];
  const senses = asArray(entry.sense).map(asRecordOrEmpty);
  const meanings = [
    ...new Set(
      senses.flatMap((sense) =>
        asArray(sense.gloss)
          .filter((value) => {
            if (typeof value !== 'object' || value === null || Array.isArray(value)) return true;
            const language = asRecord(value)['@_xml:lang'];
            return language === undefined || language === 'eng';
          })
          .map(textContent)
          .filter(Boolean)
      )
    )
  ];
  const partOfSpeech = [...new Set(senses.flatMap((sense) => directTextValues(sense, 'pos')))];
  if (!kana || meanings.length === 0) {
    throw new Error(`JMdict entry ${String(sequence)} has no reading or English meaning.`);
  }

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
  const document = asRecord(parser.parse(xml));
  const root = asRecord(document.JMdict);
  for (const value of asArray(root.entry)) {
    const entry = asRecord(value);
    const sequence = entrySequence(entry);
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
