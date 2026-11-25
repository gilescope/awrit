import { describe, expect, test } from 'bun:test';
import { TOP_BAR_HEIGHT, mouseTarget, topBarHeight } from './topBar';

describe('topBarHeight', () => {
  test('is zero unless the top bar is asked for', () => {
    expect(topBarHeight({}, {})).toBe(0);
    expect(topBarHeight({ urlBar: { defaultVisible: true } }, {})).toBe(0);
    expect(topBarHeight({}, { AWRIT_URL_BAR: '1' })).toBe(0);
  });

  test('AWRIT_URL_BAR=top or urlBar.position "top" turns it on', () => {
    expect(topBarHeight({}, { AWRIT_URL_BAR: 'top' })).toBe(TOP_BAR_HEIGHT);
    expect(topBarHeight({ urlBar: { position: 'top' } }, {})).toBe(TOP_BAR_HEIGHT);
  });

  test('the environment can turn a configured bar off', () => {
    expect(topBarHeight({ urlBar: { position: 'top' } }, { AWRIT_URL_BAR: '0' })).toBe(0);
  });
});

describe('mouseTarget', () => {
  const bar = 56;

  test('the strip at the top belongs to the toolbar, the rest to the page', () => {
    expect(mouseTarget({ y: 0, barHeight: bar })).toBe('toolbar');
    expect(mouseTarget({ y: 55, barHeight: bar })).toBe('toolbar');
    expect(mouseTarget({ y: 56, barHeight: bar })).toBe('content');
    expect(mouseTarget({ y: 900, barHeight: bar })).toBe('content');
  });

  test('without a bar everything is the page', () => {
    expect(mouseTarget({ y: 0, barHeight: 0 })).toBe('content');
  });

  test('a modal toolbar (address palette, find, help) takes every position', () => {
    expect(mouseTarget({ y: 900, barHeight: bar, toolbarModal: true })).toBe('toolbar');
    expect(mouseTarget({ y: 900, barHeight: 0, toolbarModal: true, popupOpen: true })).toBe(
      'toolbar',
    );
  });

  test('an open popup takes everything else, the strip included', () => {
    expect(mouseTarget({ y: 10, barHeight: bar, popupOpen: true })).toBe('popup');
    expect(mouseTarget({ y: 900, barHeight: bar, popupOpen: true })).toBe('popup');
  });
});
