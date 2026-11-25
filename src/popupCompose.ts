import { type NativeImage, nativeImage } from 'electron';
import { type Rect, blitBgra } from './popup';

/** The page frame with the popup's latest frame blended in (the page frame itself when there is none). */
export function withPopup(
  page: NativeImage,
  popup?: {
    node: { deviceLayout: Rect };
    frame?: { bitmap: Buffer; width: number; height: number };
  },
  /** Where the page frame sits in the pane; the popup's place is in pane coordinates. */
  origin: { x: number; y: number } = { x: 0, y: 0 },
): NativeImage {
  if (!popup?.frame) return page;
  const { width, height } = page.getSize();
  const bitmap = Buffer.from(page.toBitmap());
  const at = popup.node.deviceLayout;
  blitBgra(bitmap, width, popup.frame.bitmap, popup.frame.width, popup.frame.height, at.x - origin.x, at.y - origin.y);
  return nativeImage.createFromBitmap(bitmap, { width, height });
}
