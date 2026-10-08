import { describe, expect, it } from 'vitest';
import { nextRateDecision, rateWindowExpiry, type RateState } from './rate-limit';

const start = new Date('2026-10-08T08:00:00.000Z');

describe('authentication cooldowns', () => {
  it('allows a bounded number of attempts before a short increasing cooldown', () => {
    let state: RateState | null = null;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const result = nextRateDecision(state, start, 5);
      expect(result.allowed).toBe(true);
      state = result;
    }
    const blocked = nextRateDecision(state, start, 5);
    expect(blocked.allowed).toBe(false);
    expect(blocked.blockedUntil).toEqual(new Date(start.getTime() + 30_000));
    expect(nextRateDecision(blocked, new Date(start.getTime() + 10_000), 5)).toEqual(blocked);
    const blockedAgain = nextRateDecision(blocked, new Date(start.getTime() + 30_000), 5);
    expect(blockedAgain.blockedUntil).toEqual(new Date(start.getTime() + 90_000));
  });

  it('starts a fresh window and expires old buckets', () => {
    const earlier = nextRateDecision(null, start, 1);
    const nextWindow = new Date(start.getTime() + 15 * 60 * 1000);
    expect(nextRateDecision(earlier, nextWindow, 1)).toEqual({
      attempts: 1,
      windowStartsAt: nextWindow,
      blockedUntil: null,
      allowed: true
    });
    expect(rateWindowExpiry(start)).toEqual(new Date(start.getTime() + 30 * 60 * 1000));
  });
});
