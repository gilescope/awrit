import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Run the startup policy without launching or changing the installed owner.
const main = readFileSync(new URL('./main.ts', import.meta.url), 'utf8');
const start = main.indexOf('// macOS Dock');
const startup = main.slice(start, main.indexOf('// Before the lock'));

function hides(platform: string, dock: boolean): number {
  let hidden = 0;
  const app = dock ? { dock: { hide: () => hidden++ } } : {};
  vm.runInNewContext(startup, { process: { platform }, app });
  return hidden;
}

test('the owner startup has a Dock policy', () => {
  expect(start).toBeGreaterThan(-1);
});

test('the owner takes no place in the macOS Dock or app switcher', () => {
  expect(hides('darwin', true)).toBe(1);
});

test('other platforms have no Dock to hide', () => {
  expect(hides('linux', false)).toBe(0);
  expect(hides('linux', true)).toBe(0);
});
