import { describe, expect, test } from 'bun:test';
import { DEFAULT_SWIPE_TICKS, newSwipe, swipeSettings, swipeStep, swipeVertical } from './swipe';

const kitty = { ticks: 3, gapMs: 1000 };
const trackpad = { ticks: 12, gapMs: 150 };

/** Feeds `n` horizontal ticks `everyMs` apart; returns how many navigations fired. */
function feed(settings: typeof kitty, n: number, everyMs: number, direction: 1 | -1 = 1) {
  const s = newSwipe();
  let fired = 0;
  for (let i = 0; i < n; i++) if (swipeStep(s, direction, i * everyMs, settings)) fired++;
  return fired;
}

describe('swipeStep', () => {
  test('navigates once the ticks reach the threshold', () => {
    expect(feed(kitty, 2, 10)).toBe(0);
    expect(feed(kitty, 3, 10)).toBe(1);
  });

  test('a higher threshold ignores the sideways drift of a vertical scroll', () => {
    // A handful of stray horizontal ticks is drift, not a swipe.
    expect(feed(trackpad, 6, 10)).toBe(0);
    expect(feed(trackpad, 12, 10)).toBe(1);
  });

  test('ticks further apart than the gap do not add up', () => {
    expect(feed(trackpad, 40, 200)).toBe(0);
  });

  test('a change of direction starts the count again', () => {
    const s = newSwipe();
    for (let i = 0; i < 11; i++) swipeStep(s, 1, i * 10, trackpad);
    expect(swipeStep(s, -1, 120, trackpad)).toBe(false);
    expect(swipeStep(s, 1, 130, trackpad)).toBe(false);
  });

  test('vertical scrolling in between starts the count again', () => {
    const s = newSwipe();
    for (let i = 0; i < 11; i++) swipeStep(s, 1, i * 10, trackpad);
    swipeVertical(s);
    expect(swipeStep(s, 1, 120, trackpad)).toBe(false);
  });

  test('after navigating, the rest of the same swipe does not navigate again', () => {
    // One long swipe sends many more ticks than the threshold.
    expect(feed(trackpad, 60, 10)).toBe(1);
  });

  test('a threshold of zero turns swipe navigation off', () => {
    expect(feed({ ticks: 0, gapMs: 150 }, 100, 10)).toBe(0);
  });
});

describe('swipeSettings', () => {
  test('defaults to the built-in threshold', () => {
    expect(swipeSettings({}).ticks).toBe(DEFAULT_SWIPE_TICKS);
  });

  test('AWRIT_SWIPE_TICKS sets the threshold, and a high one shortens the gap', () => {
    expect(swipeSettings({ AWRIT_SWIPE_TICKS: '12' })).toEqual({ ticks: 12, gapMs: 150 });
    expect(swipeSettings({ AWRIT_SWIPE_TICKS: '0' }).ticks).toBe(0);
  });

  test('an unusable value falls back to the default', () => {
    expect(swipeSettings({ AWRIT_SWIPE_TICKS: 'lots' }).ticks).toBe(DEFAULT_SWIPE_TICKS);
    expect(swipeSettings({ AWRIT_SWIPE_TICKS: '-4' }).ticks).toBe(DEFAULT_SWIPE_TICKS);
  });
});
