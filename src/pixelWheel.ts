/**
 * Pixel wheel reports: trackpad movement as a distance, not as notches.
 *
 * A terminal's wheel report is one notch, whatever the fingers did, so a page scrolled in
 * steps and lost the system's own slow-down. A terminal that knows private mode 9278
 * (wezterm) sends `APC pixel-wheel ; x ; y ; dx ; dy ; ticksX ; ticksY ST` for each trackpad
 * event instead: where the pointer is and how far to move, in device pixels, and the notches
 * the same movement would have made. Other terminals ignore the mode and send notches.
 */

/** The DEC private mode that asks the terminal for pixel wheel reports. */
export const PIXEL_WHEEL_MODE = 9278;

const PREFIX = 'pixel-wheel;';
/** Further than any real event moves; a report beyond it is damaged. */
const MAX_DISTANCE = 100_000;

export type PixelWheel = {
  /** The pointer, in device pixels from the top left of the pane. */
  x: number;
  y: number;
  /** Distance in device pixels, with the sign of a wheel-left / wheel-up notch. */
  dx: number;
  dy: number;
  /** Whole notches this movement completes; at most one is non-zero. */
  ticksX: number;
  ticksY: number;
};

const WHOLE = /^-?\d{1,6}$/;
const DECIMAL = /^-?\d{1,6}(\.\d{1,4})?$/;

export function parsePixelWheel(
  escape: { kind: string; text: string } | undefined | null,
): PixelWheel | undefined {
  if (escape?.kind !== 'apc' || !escape.text.startsWith(PREFIX)) return undefined;
  const fields = escape.text.slice(PREFIX.length).split(';');
  if (fields.length !== 6) return undefined;
  const shapes = [WHOLE, WHOLE, DECIMAL, DECIMAL, WHOLE, WHOLE];
  if (!fields.every((field, i) => shapes[i].test(field))) return undefined;
  const [x, y, dx, dy, ticksX, ticksY] = fields.map(Number);
  if (x < 0 || y < 0 || Math.abs(dx) > MAX_DISTANCE || Math.abs(dy) > MAX_DISTANCE) return undefined;
  return { x, y, dx, dy, ticksX, ticksY };
}
