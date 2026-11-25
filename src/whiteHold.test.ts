import { describe, expect, test } from 'bun:test';
import { WHITE_HOLD_MS, holdWhiteFrame } from './whiteHold';

describe('holdWhiteFrame', () => {
  test('a white frame is held back briefly while a page is still arriving', () => {
    expect(holdWhiteFrame(0, 0)).toBe(true);
    expect(holdWhiteFrame(10, WHITE_HOLD_MS - 1)).toBe(true);
  });

  test('a page that is simply white is shown once the hold has run out', () => {
    // A static white page (a sign-in form) paints once: held for ever, it would never appear.
    expect(holdWhiteFrame(1, WHITE_HOLD_MS)).toBe(false);
    expect(holdWhiteFrame(1, WHITE_HOLD_MS * 10)).toBe(false);
  });

  test('a busy page stops being held after 60 paints, as before', () => {
    expect(holdWhiteFrame(60, 0)).toBe(false);
  });
});
