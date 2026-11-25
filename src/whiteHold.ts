/**
 * The fallback painter hides near-white frames while a page is arriving, so a dark terminal
 * does not flash white. A page that simply is white (a sign-in form) and static paints once:
 * held back for ever, it would never be shown, so the hold is limited in time as well as in
 * frames.
 */

/** How long a near-white frame may be held back before it is shown anyway. */
export const WHITE_HOLD_MS = 300;

/**
 * The paint count from which no frame is held. Reached by counting held frames, or set outright
 * once a hold has run out: the page is then known to be simply white, and holding each later
 * frame (one per keystroke in a form) would only add lag.
 */
export const WHITE_PAGE = 60;

/** Whether a near-white frame should still be held back, `heldMs` after the first one was. */
export function holdWhiteFrame(paintCount: number, heldMs: number): boolean {
  return paintCount < WHITE_PAGE && heldMs < WHITE_HOLD_MS;
}
