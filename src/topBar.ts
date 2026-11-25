/**
 * The top bar: an optional strip above the page holding back, forward, reload and the address,
 * like a desktop browser's. The page is laid out below it; only clicks in the strip go to the
 * toolbar, so the page keeps the keyboard. Off unless asked for.
 */

/** Height of the strip, in the layout's pixels. */
export const TOP_BAR_HEIGHT = 56;

/**
 * The strip's height: `TOP_BAR_HEIGHT` when `AWRIT_URL_BAR=top` or the config has
 * `urlBar.position: 'top'`, else 0 (no bar). `AWRIT_URL_BAR=0` turns a configured bar off.
 */
export function topBarHeight(
  config: { urlBar?: { position?: string } },
  env: Record<string, string | undefined> = process.env,
): number {
  if (env.AWRIT_URL_BAR === '0') return 0;
  return env.AWRIT_URL_BAR === 'top' || config.urlBar?.position === 'top' ? TOP_BAR_HEIGHT : 0;
}

/** Which surface a mouse event at device row `y` belongs to. `barHeight` is in device pixels. */
export function mouseTarget(at: {
  y: number;
  barHeight: number;
  /** The address palette, find bar, help or a permission prompt owns the whole pane. */
  toolbarModal?: boolean;
  popupOpen?: boolean;
}): 'toolbar' | 'popup' | 'content' {
  if (at.toolbarModal) return 'toolbar';
  if (at.popupOpen) return 'popup';
  return at.y < at.barHeight ? 'toolbar' : 'content';
}
