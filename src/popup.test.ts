import { describe, expect, test } from 'bun:test';
import { blitBgra, popupRect, requestedPopupSize } from './popup';

describe('requestedPopupSize', () => {
  const content = { width: 1000, height: 700 };

  test('uses the width and height window.open asked for', () => {
    expect(requestedPopupSize('width=500,height=600,popup=yes', content)).toEqual({
      width: 500,
      height: 600,
    });
  });

  test('tolerates spaces around the options', () => {
    expect(requestedPopupSize('popup=yes, width=480 , height=640', content)).toEqual({
      width: 480,
      height: 640,
    });
  });

  test('fills the page when no size was asked for', () => {
    expect(requestedPopupSize('', content)).toEqual(content);
    expect(requestedPopupSize('popup=yes', content)).toEqual(content);
  });

  test('ignores a size that is not a positive number', () => {
    expect(requestedPopupSize('width=abc,height=-5', content)).toEqual(content);
    expect(requestedPopupSize('width=0,height=0', content)).toEqual(content);
  });

  test('never exceeds the page', () => {
    expect(requestedPopupSize('width=5000,height=9000', content)).toEqual(content);
  });
});

describe('popupRect', () => {
  const viewport = { width: 2000, height: 1400 };

  test('centres the popup in the viewport', () => {
    expect(popupRect(viewport, { width: 500, height: 600 }, 1)).toEqual({
      x: 750,
      y: 400,
      width: 500,
      height: 600,
    });
  });

  test('scales a logical size by the device pixel ratio', () => {
    expect(popupRect(viewport, { width: 500, height: 600 }, 2)).toEqual({
      x: 500,
      y: 100,
      width: 1000,
      height: 1200,
    });
  });

  test('clamps to the viewport and never goes negative', () => {
    const r = popupRect({ width: 800, height: 600 }, { width: 5000, height: 5000 }, 2);
    expect(r).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });

  test('is at least one pixel in each direction', () => {
    const r = popupRect(viewport, { width: 0, height: 0 }, 1);
    expect(r.width).toBe(1);
    expect(r.height).toBe(1);
  });
});

describe('blitBgra', () => {
  // 4x3 destination of 0x11 bytes; a 2x2 source of 0xAA bytes.
  const dst = () => Buffer.alloc(4 * 3 * 4, 0x11);
  const src = Buffer.alloc(2 * 2 * 4, 0xaa);
  const painted = (b: Buffer, w: number) => {
    const rows: string[] = [];
    for (let y = 0; y < b.length / 4 / w; y++) {
      let row = '';
      for (let x = 0; x < w; x++) row += b[(y * w + x) * 4] === 0xaa ? 'A' : '.';
      rows.push(row);
    }
    return rows;
  };

  test('copies the source into the destination at x, y', () => {
    const d = dst();
    blitBgra(d, 4, src, 2, 2, 1, 1);
    expect(painted(d, 4)).toEqual(['....', '.AA.', '.AA.']);
  });

  test('clips what falls outside the destination', () => {
    const d = dst();
    blitBgra(d, 4, src, 2, 2, 3, 2);
    expect(painted(d, 4)).toEqual(['....', '....', '...A']);
  });

  test('clips a negative position', () => {
    const d = dst();
    blitBgra(d, 4, src, 2, 2, -1, -1);
    expect(painted(d, 4)).toEqual(['A...', '....', '....']);
  });

  test('draws nothing when entirely outside', () => {
    const d = dst();
    blitBgra(d, 4, src, 2, 2, 9, 9);
    expect(painted(d, 4)).toEqual(['....', '....', '....']);
  });

  test('leaves every byte outside the copied rectangle alone', () => {
    const d = dst();
    blitBgra(d, 4, src, 2, 2, 1, 0);
    const untouched = d.filter((_, i) => {
      const px = Math.floor(i / 4);
      const x = px % 4;
      const y = Math.floor(px / 4);
      return !(x >= 1 && x < 3 && y < 2);
    });
    expect(untouched.every((b) => b === 0x11)).toBe(true);
  });
});
