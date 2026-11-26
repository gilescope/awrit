import { expect, test } from 'bun:test';
import { parsePixelWheel } from './pixelWheel';

const apc = (text: string) => ({ kind: 'apc' as const, text });

test('reads a pixel wheel report', () => {
  expect(parsePixelWheel(apc('pixel-wheel;120;45;1.50;-12.50;0;-1'))).toEqual({
    x: 120,
    y: 45,
    dx: 1.5,
    dy: -12.5,
    ticksX: 0,
    ticksY: -1,
  });
});

test('other escapes are not pixel wheel reports', () => {
  expect(parsePixelWheel(apc('Gi=1;OK'))).toBeUndefined();
  expect(parsePixelWheel({ kind: 'osc', text: 'pixel-wheel;1;2;3;4;5;6' })).toBeUndefined();
  expect(parsePixelWheel(undefined)).toBeUndefined();
});

test('a malformed report is refused, not guessed at', () => {
  for (const text of [
    'pixel-wheel;120;45;1.50;-12.50;0',
    'pixel-wheel;120;45;1.50;-12.50;0;-1;9',
    'pixel-wheel;x;45;1.50;-12.50;0;-1',
    'pixel-wheel;120;45;NaN;-12.50;0;-1',
    'pixel-wheel;120;45;1e9;-12.50;0;-1',
    'pixel-wheel;-1;45;1.50;-12.50;0;-1',
    'pixel-wheel;120;45;1.50;-12.50;0.5;-1',
    'pixel-wheel;120;45;;-12.50;0;-1',
  ]) {
    expect(parsePixelWheel(apc(text))).toBeUndefined();
  }
});
