import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { XMLParser } from 'fast-xml-parser';
import type { WordRecord } from '../../../src/lib/content/model.ts';
import type { SelectionEntry } from '../../../src/lib/content/words.ts';
import { jmdictSource } from './source.ts';

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

// JMdict states a sense's parts of speech once; later senses without their own inherit them.
function sensesWithPartsOfSpeech(entry: Record<string, unknown>) {
  let inherited: string[] = [];
  return asArray(entry.sense).map((value) => {
    const sense = asRecordOrEmpty(value);
    const own = directTextValues(sense, 'pos');
    if (own.length > 0) inherited = own;
    return { sense, partOfSpeech: inherited };
  });
}

function englishGlosses(sense: Record<string, unknown>): string[] {
  return asArray(sense.gloss)
    .filter((value) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) return true;
      const language = asRecord(value)['@_xml:lang'];
      return language === undefined || language === 'eng';
    })
    .map(textContent)
    .filter(Boolean);
}

function recordFromEntry(
  entry: Record<string, unknown>,
  selected: SelectionEntry,
  selection: string
): WordRecord {
  const { sequence } = selected;
  const readings = asArray(entry.r_ele).map(asRecordOrEmpty);
  const reading =
    selected.reading === undefined
      ? readings[0]
      : readings.find((element) => directTextValues(element, 'reb')[0] === selected.reading);
  const kana = reading === undefined ? undefined : directTextValues(reading, 'reb')[0];
  if (!kana) {
    throw new Error(
      selected.reading === undefined
        ? `JMdict entry ${String(sequence)} has no reading or English meaning.`
        : `JMdict entry ${String(sequence)} has no reading ${selected.reading}.`
    );
  }
  // A reading restricted to some written forms (re_restr), or to none (re_nokanji), keeps only those.
  const restrictions = reading === undefined ? [] : directTextValues(reading, 're_restr');
  const noKanji = reading !== undefined && 're_nokanji' in reading;
  const kanji = noKanji
    ? []
    : [
        ...new Set(
          asArray(entry.k_ele)
            .flatMap((value) => directTextValues(asRecordOrEmpty(value), 'keb'))
            .filter((form) => restrictions.length === 0 || restrictions.includes(form))
        )
      ];

  const senses = sensesWithPartsOfSpeech(entry);
  const chosen = (selected.senses ?? [1]).map((number) => {
    const sense = senses[number - 1];
    if (sense === undefined)
      throw new Error(`JMdict entry ${String(sequence)} has no sense ${String(number)}.`);
    return sense;
  });
  const meanings = [...new Set(chosen.flatMap(({ sense }) => englishGlosses(sense)))];
  const partOfSpeech = [...new Set(chosen.flatMap((sense) => sense.partOfSpeech))];
  if (meanings.length === 0) {
    throw new Error(`JMdict entry ${String(sequence)} has no reading or English meaning.`);
  }

  return {
    id: `word.jmdict.${String(sequence)}`,
    kana,
    ...(kanji.length > 0 ? { kanji } : {}),
    meanings,
    partOfSpeech,
    sourceEntry: { source: 'JMdict', sequence },
    selection,
    origin: 'imported'
  };
}

/**
 * Extract only the selected JMdict entries, preserving source-defined order. Each entry
 * keeps the selection's reading (its first one by default) and only the selected senses
 * (the first by default), so a beginner is not taught every dictionary sense.
 */
export function importSelectedWords(
  xml: string,
  entries: readonly SelectionEntry[],
  selection: string
): readonly WordRecord[] {
  const selected = new Map(entries.map((entry) => [entry.sequence, entry]));
  const found = new Map<number, WordRecord>();
  const document = asRecord(parser.parse(xml));
  const root = asRecord(document.JMdict);
  for (const value of asArray(root.entry)) {
    const entry = asRecord(value);
    const sequence = entrySequence(entry);
    const choice = selected.get(sequence);
    if (choice === undefined) continue;
    if (found.has(sequence))
      throw new Error(`JMdict entry ${String(sequence)} occurs more than once.`);
    found.set(sequence, recordFromEntry(entry, choice, selection));
  }

  const missing = entries.filter(({ sequence }) => !found.has(sequence));
  if (missing.length > 0)
    throw new Error(
      `Selected JMdict entries not found: ${missing.map(({ sequence }) => sequence).join(', ')}.`
    );
  return [...found.values()];
}

export interface ImportedWordDataset {
  readonly provenance: { readonly source: string; readonly licence: string };
  readonly release: string;
  readonly sha256: string;
  readonly selection: string;
  readonly entries: readonly WordRecord[];
}

/** The compact, deterministic dataset shape written by the CLI. */
export function createDataset(
  entries: readonly WordRecord[],
  selection: string
): ImportedWordDataset {
  return {
    provenance: { source: jmdictSource.source, licence: jmdictSource.licence },
    release: jmdictSource.release,
    sha256: jmdictSource.sha256,
    selection,
    entries
  };
}
