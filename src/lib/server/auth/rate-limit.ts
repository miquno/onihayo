export interface RateState {
  attempts: number;
  windowStartsAt: Date;
  blockedUntil: Date | null;
}

export interface RateDecision extends RateState {
  allowed: boolean;
}

const windowMs = 15 * 60 * 1000;
const maxCooldownMs = 15 * 60 * 1000;

/** A blocked request never extends the cooldown; old windows start fresh. */
export function nextRateDecision(state: RateState | null, now: Date, limit: number): RateDecision {
  const time = now.getTime();
  if (state?.blockedUntil && state.blockedUntil.getTime() > time) {
    return { ...state, allowed: false };
  }
  const fresh = state === null || state.windowStartsAt.getTime() <= time - windowMs;
  const attempts = fresh ? 1 : state.attempts + 1;
  const windowStartsAt = fresh ? now : state.windowStartsAt;
  if (attempts <= limit) return { attempts, windowStartsAt, blockedUntil: null, allowed: true };
  const exponent = Math.min(attempts - limit - 1, 5);
  const cooldown = Math.min(30_000 * 2 ** exponent, maxCooldownMs);
  return {
    attempts,
    windowStartsAt,
    blockedUntil: new Date(time + cooldown),
    allowed: false
  };
}

export function rateWindowExpiry(windowStartsAt: Date): Date {
  return new Date(windowStartsAt.getTime() + windowMs + maxCooldownMs);
}
