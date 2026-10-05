/*
 * The one versioned browser document for guest progress. Storage is an
 * untrusted boundary: every read is size-limited, parsed, and validated.
 */

import * as v from 'valibot';
import { hiragana } from '$lib/content/kana/hiragana';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakana } from '$lib/content/kana/katakana';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import {
  emptyProgress,
  type LearnerProgress,
  type LessonCompletion,
  type ProgressRecord
} from './records';
import { stages } from './stages';

export const progressStorageKey = 'onihayo:progress';
export const rejectedProgressStorageKey = 'onihayo:progress.rejected';
export const currentProgressVersion = 1;
/** ADR 0008 budgets under 1 MB for the full N5 progress document. */
export const maxProgressDocumentBytes = 1_000_000;

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

export interface ProgressExport {
  readonly json: string | null;
  readonly notice: ProgressNotice | null;
}

export type ProgressImportResult =
  | { readonly status: 'imported'; readonly progress: LearnerProgress }
  | { readonly status: 'invalid' | 'newer' | 'unavailable' };

export type ProgressResetResult = 'reset' | 'unavailable';

const nonNegativeInteger = v.pipe(v.number(), v.safeInteger(), v.minValue(0));
const id = v.pipe(v.string(), v.minLength(1), v.maxLength(200));
const progressRecordSchema = v.strictObject({
  stage: v.picklist(stages),
  attempts: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
  correct: nonNegativeInteger,
  firstSeen: nonNegativeInteger,
  lastSeen: nonNegativeInteger
});
const lessonCompletionSchema = v.strictObject({ completedAt: nonNegativeInteger });
const progressDocumentSchema = v.strictObject({
  version: v.literal(currentProgressVersion),
  items: v.pipe(v.array(v.tuple([id, progressRecordSchema])), v.maxLength(10_000)),
  lessons: v.pipe(v.array(v.tuple([id, lessonCompletionSchema])), v.maxLength(2_000)),
  settings: v.strictObject({})
});
type ProgressDocument = v.InferOutput<typeof progressDocumentSchema>;

const knownItemIds = new Set<string>([...hiragana, ...katakana].map(({ id: itemId }) => itemId));
const knownLessonIds = new Set<string>(
  [...hiraganaLessons, ...katakanaLessons].map(({ id: lessonId }) => lessonId)
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

  return { progress: toLearnerProgress(document.value), notice: null };
}

/** Export a validated progress document without exposing malformed or newer data. */
export function exportProgress(storage: ProgressStorage): ProgressExport {
  let raw: string | null;
  try {
    raw = storage.getItem(progressStorageKey);
  } catch {
    return { json: null, notice: 'unavailable' };
  }

  if (raw === null) return { json: serializeDocument(emptyDocument()), notice: null };

  const parsed = parseDocument(raw);
  if (parsed.kind === 'newer') return { json: null, notice: 'reload' };
  if (parsed.kind === 'invalid') {
    const recovered = recover(storage, raw);
    return {
      json: recovered.notice === 'recovered' ? serializeDocument(emptyDocument()) : null,
      notice: recovered.notice
    };
  }

  return { json: serializeDocument(parsed.value), notice: null };
}

/** Validate a progress file completely before replacing the current document. */
export function importProgress(storage: ProgressStorage, raw: string): ProgressImportResult {
  const parsed = parseDocument(raw);
  if (parsed.kind === 'newer') return { status: 'newer' };
  if (parsed.kind === 'invalid') return { status: 'invalid' };

  try {
    storage.setItem(progressStorageKey, raw);
    return { status: 'imported', progress: toLearnerProgress(parsed.value) };
  } catch {
    return { status: 'unavailable' };
  }
}

/** Remove saved progress and its recovery copy after the learner confirms reset. */
export function resetProgress(storage: ProgressStorage): ProgressResetResult {
  try {
    storage.removeItem(progressStorageKey);
    storage.removeItem(rejectedProgressStorageKey);
    return 'reset';
  } catch {
    return 'unavailable';
  }
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
  if (new TextEncoder().encode(serialized).byteLength > maxProgressDocumentBytes) {
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
  | { readonly kind: 'valid'; readonly value: ProgressDocument }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'newer' } {
  if (
    raw.length > maxProgressDocumentBytes ||
    new TextEncoder().encode(raw).byteLength > maxProgressDocumentBytes
  ) {
    return { kind: 'invalid' };
  }

  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return { kind: 'invalid' };
  }

  if (isNewerVersion(input)) return { kind: 'newer' };
  const result = v.safeParse(progressDocumentSchema, input);
  if (!result.success || !hasValidRecords(result.output)) return { kind: 'invalid' };
  return { kind: 'valid', value: result.output };
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

function hasValidRecords(document: ProgressDocument): boolean {
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

function emptyDocument(): ProgressDocument {
  return { version: currentProgressVersion, items: [], lessons: [], settings: {} };
}

function serializeDocument(document: ProgressDocument): string {
  return JSON.stringify(document);
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
