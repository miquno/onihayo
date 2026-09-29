/** What a progress bar shows and announces. */
export interface Progress {
  /** `value` clamped to `0…max`. */
  value: number;
  max: number;
  /** Share of `max` reached, `0…100`, for drawing the bar. */
  percent: number;
  /** Shown next to the label and announced by screen readers, e.g. "3 of 10". */
  text: string;
}

/**
 * Normalizes a progress bar's input. Out-of-range values are clamped so the bar
 * never over- or underflows; non-finite numbers or a non-positive `max` are
 * programming errors and throw.
 */
export function toProgress(value: number, max: number, text?: string): Progress {
  if (!Number.isFinite(max) || max <= 0) {
    throw new RangeError(`Progress max must be a positive number, got ${String(max)}`);
  }
  if (!Number.isFinite(value)) {
    throw new RangeError(`Progress value must be a finite number, got ${String(value)}`);
  }
  const clamped = Math.min(Math.max(value, 0), max);
  return {
    value: clamped,
    max,
    percent: (clamped / max) * 100,
    text: text ?? `${String(clamped)} of ${String(max)}`
  };
}
