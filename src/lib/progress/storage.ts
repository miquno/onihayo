/*
 * The one versioned browser document for guest progress. Storage is an
 * untrusted boundary: every read is size-limited, parsed, and validated.
 */

import * as v from 'valibot';
import { hiragana } from '$lib/content/kana/hiragana';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakana } from '$lib/content/kana/katakana';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { wordLessons, words } from '$lib/content/word-lessons';
import {
  emptyProgress,
  type LearnerProgress,
  type LessonCompletion,
  type ProgressRecord
} from './records';
import { stages } from './stages';

export const progressStorageKey = 'onihayo:progress';
export const rejectedProgressStorageKey = 'onihayo:progress.rejected';
export const currentProgressVersion = 2;
/** ADR 0008 budgets under 1 MB for the full N5 progress document. */
export const maxProgressDocumentLength = 1_000_000;

export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type ProgressNotice = 'recovered' | 'unavailable' | 'reload';

export interface ProgressLoad {
  readonly progress: LearnerProgress;
  readonly notice: ProgressNotice | null;
}

export type ProgressImportResult =
  | { readonly imported: true; readonly progress: LearnerProgress }
  | { readonly imported: false; readonly reason: 'invalid' | 'newer' | 'unavailable' };

const nonNegativeInteger = v.pipe(v.number(), v.safeInteger(), v.minValue(0));
const id = v.pipe(v.string(), v.minLength(1), v.maxLength(200));
const progressRecordSchema = v.strictObject({
  stage: v.picklist(stages),
  attempts: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
  correct: nonNegativeInteger,
  firstSeen: nonNegativeInteger,
  lastSeen: nonNegativeInteger,
  reviewSchedule: v.nullable(
    v.strictObject({
      dueDay: v.pipe(v.number(), v.safeInteger()),
      intervalDays: v.picklist([1, 3, 7, 14, 30]),
      successfulReviews: nonNegativeInteger,
      lapses: nonNegativeInteger,
      lastReviewedAt: nonNegativeInteger
    })
  )
});
const progressRecordV1Schema = v.strictObject({
  stage: v.picklist(stages),
  attempts: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
  correct: nonNegativeInteger,
  firstSeen: nonNegativeInteger,
  lastSeen: nonNegativeInteger
});
const lessonCompletionSchema = v.strictObject({ completedAt: nonNegativeInteger });
const progressDocumentV1Schema = v.strictObject({
  version: v.literal(1),
  items: v.pipe(v.array(v.tuple([id, progressRecordV1Schema])), v.maxLength(10_000)),
  lessons: v.pipe(v.array(v.tuple([id, lessonCompletionSchema])), v.maxLength(2_000)),
  settings: v.strictObject({})
});
const progressDocumentSchema = v.strictObject({
  version: v.literal(currentProgressVersion),
  items: v.pipe(v.array(v.tuple([id, progressRecordSchema])), v.maxLength(10_000)),
  lessons: v.pipe(v.array(v.tuple([id, lessonCompletionSchema])), v.maxLength(2_000)),
  settings: v.strictObject({})
});
type ProgressDocumentV1 = v.InferOutput<typeof progressDocumentV1Schema>;
type ProgressDocument = v.InferOutput<typeof progressDocumentSchema>;

const knownItemIds = new Set<string>(
  [...hiragana, ...katakana, ...words].map(({ id: itemId }) => itemId)
);
const knownLessonIds = new Set<string>(
  [...hiraganaLessons, ...katakanaLessons, ...wordLessons].map(({ id: lessonId }) => lessonId)
);

/** Read and validate the stored document, recovering malformed data without throwing. */
export function readProgress(storage: ProgressStorage): ProgressLoad {
  let raw: string | null;
  try {
    raw = storage.getItem(progressStorageKey);
  } catch {
    return { progress: emptyProgress(), notice: 'unavailable' };
  }

  if (raw === null) return { progress: emptyProgress(), notice: null };
  const document = parseDocument(raw);
  if (document.kind === 'newer') return { progress: emptyProgress(), notice: 'reload' };
  if (document.kind === 'invalid') return recover(storage, raw);

  if (document.migrated) {
    const migratedRaw = JSON.stringify(document.value);
    if (migratedRaw.length > maxProgressDocumentLength) {
      return { progress: toLearnerProgress(document.value), notice: 'unavailable' };
    }
    try {
      storage.setItem(progressStorageKey, migratedRaw);
    } catch {
      return { progress: toLearnerProgress(document.value), notice: 'unavailable' };
    }
  }

  return { progress: toLearnerProgress(document.value), notice: null };
}

/**
 * Apply a change to the latest stored progress, so concurrent tabs do not
 * overwrite each other's updates. Unknown IDs survive writes by older builds.
 */
export function updateProgress(
  storage: ProgressStorage,
  update: (progress: LearnerProgress) => LearnerProgress,
  inMemoryProgress: LearnerProgress = emptyProgress()
): ProgressLoad {
  let raw: string | null;
  try {
    raw = storage.getItem(progressStorageKey);
  } catch {
    return { progress: update(inMemoryProgress), notice: 'unavailable' };
  }

  const parsed =
    raw === null ? { kind: 'valid' as const, value: emptyDocument() } : parseDocument(raw);
  if (parsed.kind === 'newer') return { progress: emptyProgress(), notice: 'reload' };
  if (parsed.kind === 'invalid') {
    const recovered = recover(storage, raw as string);
    const next = update(recovered.progress);
    return writeDocument(storage, next, [], [], recovered.notice);
  }

  const latest = toLearnerProgress(parsed.value);
  const next = update(latest);
  const unknownItems = parsed.value.items.filter(([itemId]) => !knownItemIds.has(itemId));
  const unknownLessons = parsed.value.lessons.filter(([lessonId]) => !knownLessonIds.has(lessonId));
  return writeDocument(storage, next, unknownItems, unknownLessons, null);
}

/** A portable, bounded JSON document containing only progress known to this build. */
export function exportProgress(progress: LearnerProgress): string {
  const document: ProgressDocument = {
    version: currentProgressVersion,
    items: [...progress.items].map(([itemId, record]) => [itemId, record]),
    lessons: [...progress.lessons].map(([lessonId, completion]) => [lessonId, completion]),
    settings: {}
  };
  const serialized = JSON.stringify(document);
  if (serialized.length > maxProgressDocumentLength) {
    throw new RangeError('Progress is too large to export.');
  }
  return serialized;
}

/** Validate an imported document before replacing the current browser progress. */
export function importProgress(storage: ProgressStorage, raw: string): ProgressImportResult {
  const parsed = parseDocument(raw);
  if (parsed.kind === 'newer') return { imported: false, reason: 'newer' };
  if (parsed.kind === 'invalid') return { imported: false, reason: 'invalid' };

  let current: string | null;
  try {
    current = storage.getItem(progressStorageKey);
  } catch {
    return { imported: false, reason: 'unavailable' };
  }
  if (current !== null && parseDocument(current).kind === 'newer') {
    return { imported: false, reason: 'newer' };
  }

  const progress = toLearnerProgress(parsed.value);
  const result = writeDocument(storage, progress, [], [], null);
  return result.notice === null
    ? { imported: true, progress: result.progress }
    : { imported: false, reason: 'unavailable' };
}

/** Remove both active progress and any recovery copy after explicit confirmation. */
export function resetProgress(storage: ProgressStorage): boolean {
  try {
    storage.removeItem(progressStorageKey);
    storage.removeItem(rejectedProgressStorageKey);
    return true;
  } catch {
    return false;
  }
}

function writeDocument(
  storage: ProgressStorage,
  progress: LearnerProgress,
  unknownItems: ProgressDocument['items'],
  unknownLessons: ProgressDocument['lessons'],
  previousNotice: ProgressNotice | null
): ProgressLoad {
  const document: ProgressDocument = {
    version: currentProgressVersion,
    items: [
      ...unknownItems,
      ...[...progress.items].map(([itemId, record]): ProgressDocument['items'][number] => [
        itemId,
        record
      ])
    ],
    lessons: [
      ...unknownLessons,
      ...[...progress.lessons].map(
        ([lessonId, completion]): ProgressDocument['lessons'][number] => [lessonId, completion]
      )
    ],
    settings: {}
  };
  const serialized = JSON.stringify(document);
  if (serialized.length > maxProgressDocumentLength) {
    return { progress, notice: 'unavailable' };
  }

  try {
    storage.setItem(progressStorageKey, serialized);
    return { progress, notice: previousNotice };
  } catch {
    return { progress, notice: 'unavailable' };
  }
}

function parseDocument(
  raw: string
):
  | { readonly kind: 'valid'; readonly value: ProgressDocument; readonly migrated: boolean }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'newer' } {
  if (raw.length > maxProgressDocumentLength) return { kind: 'invalid' };

  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return { kind: 'invalid' };
  }

  if (isNewerVersion(input)) return { kind: 'newer' };

  if (isVersion(input, 1)) {
    const result = v.safeParse(progressDocumentV1Schema, input);
    if (!result.success || !hasValidRecords(result.output)) return { kind: 'invalid' };
    return { kind: 'valid', value: migrateV1ToV2(result.output), migrated: true };
  }

  const result = v.safeParse(progressDocumentSchema, input);
  if (!result.success || !hasValidRecords(result.output)) return { kind: 'invalid' };
  return { kind: 'valid', value: result.output, migrated: false };
}

function isNewerVersion(input: unknown): boolean {
  return (
    typeof input === 'object' &&
    input !== null &&
    'version' in input &&
    typeof input.version === 'number' &&
    Number.isSafeInteger(input.version) &&
    input.version > currentProgressVersion
  );
}

function isVersion(input: unknown, version: number): boolean {
  return (
    typeof input === 'object' && input !== null && 'version' in input && input.version === version
  );
}

function hasValidRecords(document: ProgressDocument | ProgressDocumentV1): boolean {
  const itemIds = new Set<string>();
  for (const [itemId, record] of document.items) {
    if (
      itemIds.has(itemId) ||
      record.correct > record.attempts ||
      record.firstSeen > record.lastSeen
    ) {
      return false;
    }
    itemIds.add(itemId);
  }

  const lessonIds = new Set<string>();
  for (const [lessonId] of document.lessons) {
    if (lessonIds.has(lessonId)) return false;
    lessonIds.add(lessonId);
  }
  return true;
}

function toLearnerProgress(document: ProgressDocument): LearnerProgress {
  const items = new Map<string, ProgressRecord>();
  for (const [itemId, record] of document.items) {
    if (knownItemIds.has(itemId)) items.set(itemId, record);
  }

  const lessons = new Map<string, LessonCompletion>();
  for (const [lessonId, completion] of document.lessons) {
    if (knownLessonIds.has(lessonId)) lessons.set(lessonId, completion);
  }
  return { items, lessons };
}

/** Version 1 had no scheduler state; preserve all existing progress and start unscheduled. */
function migrateV1ToV2(document: ProgressDocumentV1): ProgressDocument {
  return {
    version: currentProgressVersion,
    items: document.items.map(([itemId, record]) => [itemId, { ...record, reviewSchedule: null }]),
    lessons: document.lessons,
    settings: {}
  };
}

function emptyDocument(): ProgressDocument {
  return { version: currentProgressVersion, items: [], lessons: [], settings: {} };
}

function recover(storage: ProgressStorage, raw: string): ProgressLoad {
  try {
    storage.setItem(rejectedProgressStorageKey, raw);
    storage.removeItem(progressStorageKey);
    return { progress: emptyProgress(), notice: 'recovered' };
  } catch {
    return { progress: emptyProgress(), notice: 'unavailable' };
  }
}
