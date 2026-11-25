/**
 * Turning a run of horizontal wheel ticks into "back" or "forward".
 *
 * A wheel sends a few ticks, and three in a row is a clear request. A trackpad sends a stream
 * of them, and scrolling down a page with two fingers leaks some sideways: there three ticks
 * are noise, so the threshold is a setting (`AWRIT_SWIPE_TICKS`).
 */

/** Ticks in one direction that make a swipe, unless `AWRIT_SWIPE_TICKS` says otherwise. */
export const DEFAULT_SWIPE_TICKS = 3;

export type SwipeSettings = {
  /** Ticks in one direction that make a swipe; 0 turns swipe navigation off. */
  ticks: number;
  /** Ticks further apart than this do not add up. */
  gapMs: number;
};

export type SwipeState = { count: number; direction: number; lastAt: number; spent: boolean };

export function newSwipe(): SwipeState {
  return { count: 0, direction: 0, lastAt: 0, spent: false };
}

/**
 * The settings from the environment. A threshold above the default means a trackpad's stream
 * of ticks, where a real swipe has no pauses: the gap shortens to match.
 */
export function swipeSettings(
  env: Record<string, string | undefined> = process.env,
): SwipeSettings {
  const raw = env.AWRIT_SWIPE_TICKS;
  const parsed = raw !== undefined && /^\d+$/.test(raw) ? Number.parseInt(raw, 10) : undefined;
  const ticks = parsed ?? DEFAULT_SWIPE_TICKS;
  return { ticks, gapMs: ticks > DEFAULT_SWIPE_TICKS ? 150 : 1000 };
}

/**
 * Counts one horizontal tick; true when it completes a swipe. A swipe fires once: the ticks
 * that follow in the same gesture are ignored until it pauses or turns.
 */
export function swipeStep(
  state: SwipeState,
  direction: 1 | -1,
  now: number,
  settings: SwipeSettings,
): boolean {
  if (state.direction !== direction || now - state.lastAt > settings.gapMs) {
    state.count = 0;
    state.spent = false;
  }
  state.direction = direction;
  state.lastAt = now;
  state.count++;
  if (settings.ticks <= 0 || state.spent || state.count < settings.ticks) return false;
  state.spent = true;
  return true;
}

/** A vertical tick: whatever sideways ticks came before were drift, not a swipe. */
export function swipeVertical(state: SwipeState): void {
  state.count = 0;
  state.spent = false;
  state.direction = 0;
}
