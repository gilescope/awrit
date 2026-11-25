/** Size and placement of a page's `window.open` popup when it is drawn over the page it came from. */

export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };

/** The positive integer in `window.open` feature `name`, or undefined. */
function featureNumber(features: string, name: string): number | undefined {
  for (const part of features.split(',')) {
    const [key, value] = part.split('=');
    if (key?.trim() !== name) continue;
    const n = Number.parseInt(value ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
}

/**
 * The popup size, in logical pixels, from a `window.open` feature string such as
 * "width=500,height=600". A missing or unusable size fills the page; a size larger
 * than the page is cut to it.
 */
export function requestedPopupSize(features: string, content: Size): Size {
  const width = featureNumber(features, 'width');
  const height = featureNumber(features, 'height');
  return {
    width: Math.min(width ?? content.width, content.width),
    height: Math.min(height ?? content.height, content.height),
  };
}

/** Where a popup of `logical` size goes, in device pixels, centred in `viewport` (device pixels). */
export function popupRect(viewport: Size, logical: Size, dpr: number): Rect {
  const width = Math.max(1, Math.min(Math.round(logical.width * dpr), viewport.width));
  const height = Math.max(1, Math.min(Math.round(logical.height * dpr), viewport.height));
  return {
    x: Math.max(0, Math.floor((viewport.width - width) / 2)),
    y: Math.max(0, Math.floor((viewport.height - height) / 2)),
    width,
    height,
  };
}

/**
 * Copies a BGRA `src` (srcWidth x srcHeight) into the BGRA `dst` (dstWidth wide) with its top left
 * at (x, y), clipped to `dst`. Used to put a popup's frame into the page's frame, so the terminal
 * still shows one image.
 */
export function blitBgra(
  dst: Buffer,
  dstWidth: number,
  src: Buffer,
  srcWidth: number,
  srcHeight: number,
  x: number,
  y: number,
): void {
  const dstHeight = Math.floor(dst.length / 4 / dstWidth);
  const left = Math.max(0, x);
  const right = Math.min(dstWidth, x + srcWidth);
  if (right <= left) return;
  const bytes = (right - left) * 4;
  for (let row = Math.max(0, y); row < Math.min(dstHeight, y + srcHeight); row++) {
    const from = ((row - y) * srcWidth + (left - x)) * 4;
    src.copy(dst, (row * dstWidth + left) * 4, from, from + bytes);
  }
}
