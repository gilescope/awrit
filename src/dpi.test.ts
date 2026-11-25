import { describe, expect, test } from 'bun:test';
import { scaleOverride } from './dpi';

describe('scaleOverride', () => {
  test('is the number in AWRIT_DISPLAY_SCALE', () => {
    expect(scaleOverride({ AWRIT_DISPLAY_SCALE: '1' })).toBe(1);
    expect(scaleOverride({ AWRIT_DISPLAY_SCALE: '1.5' })).toBe(1.5);
  });

  test('is nothing when unset, empty or not a positive number', () => {
    expect(scaleOverride({})).toBeUndefined();
    expect(scaleOverride({ AWRIT_DISPLAY_SCALE: '' })).toBeUndefined();
    expect(scaleOverride({ AWRIT_DISPLAY_SCALE: 'two' })).toBeUndefined();
    expect(scaleOverride({ AWRIT_DISPLAY_SCALE: '0' })).toBeUndefined();
    expect(scaleOverride({ AWRIT_DISPLAY_SCALE: '-2' })).toBeUndefined();
  });
});
