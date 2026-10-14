import { pruneActivity } from './activity';
import type { LearnerProgress, ProgressRecord } from './records';

/** Merge a guest document once, without adding counters that may describe the same answers. */
export function mergeProgress(account: LearnerProgress, guest: LearnerProgress): LearnerProgress {
  const items = new Map(account.items);
  for (const [id, incoming] of guest.items) {
    const current = items.get(id);
    if (current === undefined) {
      items.set(id, incoming);
      continue;
    }
    const preferred = preferredRecord(current, incoming);
    items.set(id, {
      ...preferred,
      attempts: Math.max(current.attempts, incoming.attempts),
      correct: Math.max(current.correct, incoming.correct),
      firstSeen: Math.min(current.firstSeen, incoming.firstSeen),
      lastSeen: Math.max(current.lastSeen, incoming.lastSeen)
    });
  }
  const lessons = new Map(account.lessons);
  for (const [id, completion] of guest.lessons) {
    const current = lessons.get(id);
    if (current === undefined || completion.completedAt < current.completedAt) {
      lessons.set(id, completion);
    }
  }
  // Both sides may have counted the same answers, so a day keeps the larger count, never the sum.
  const activity = new Map(account.activity);
  for (const [day, count] of guest.activity) {
    activity.set(day, Math.max(activity.get(day) ?? 0, count));
  }
  return { items, lessons, settings: account.settings, activity: pruneActivity(activity) };
}

function preferredRecord(a: ProgressRecord, b: ProgressRecord): ProgressRecord {
  if (a.reviewSchedule === null)
    return b.reviewSchedule === null && a.lastSeen >= b.lastSeen ? a : b;
  if (b.reviewSchedule === null) return a;
  return a.reviewSchedule.lastReviewedAt >= b.reviewSchedule.lastReviewedAt ? a : b;
}
