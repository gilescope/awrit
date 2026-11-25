/**
 * The fallback painter hides near-white frames while a page is arriving, so a dark terminal
 * does not flash white. A page that simply is white (a sign-in form) and static paints once:
 * held back for ever, it would never be shown, so the hold is limited in time as well as in
 * frames.
 */

/** How long a near-white frame may be held back before it is shown anyway. */
export const WHITE_HOLD_MS = 300;

/** Whether a near-white frame should still be held back, `heldMs` after the first one was. */
export function holdWhiteFrame(paintCount: number, heldMs: number): boolean {
  return paintCount < 60 && heldMs < WHITE_HOLD_MS;
}
