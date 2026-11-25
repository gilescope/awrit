import path from 'node:path';
import { readFileSync } from 'node:fs';

/**
 * A display scale forced by the user: `AWRIT_DISPLAY_SCALE=1` for a terminal that reports its
 * window in physical pixels on a Retina/HiDPI display, where awrit's page renders 1:1 with those
 * pixels but mouse positions would otherwise be divided by the display's scale factor.
 */
export function scaleOverride(
  env: Record<string, string | undefined> = process.env,
): number | undefined {
  const scale = Number.parseFloat(env.AWRIT_DISPLAY_SCALE ?? '');
  return scale > 0 ? scale : undefined;
}

/**
 * For now just detects the Wayland virtual display scale in kitty, because
 * kitty actually respects that while Chrome and Ghostty do not
 */
export function getDisplayScale(): number | undefined {
  const { TERM, WAYLAND_DISPLAY, XDG_SESSION_TYPE, HOME } = process.env;
  const isWayland = WAYLAND_DISPLAY != null || XDG_SESSION_TYPE === 'wayland';
  const isKitty = TERM === 'xterm-kitty';

  if (isKitty && isWayland && HOME != null) {
    // pulling this from the wayland client is like pulling Excalibur from the stone
    // so we're just going to read the monitors file
    let monitorsFile: string;
    try {
      monitorsFile = readFileSync(path.join(HOME, '.config/monitors.xml'), 'utf8').replaceAll(
        /\s/g,
        '',
      );
    } catch {
      return;
    }

    const configurations = monitorsFile.match(/<configuration>([\S]*?)<\/configuration>/g);
    let monitors = configurations?.filter((monitor) =>
      monitor.includes('<layoutmode>logical</layoutmode>'),
    );

    if (monitors == null) return;
    if (monitors.length === 0) {
      monitors = configurations?.filter((monitor) =>
        monitor.includes('<layoutmode>physical</layoutmode>'),
      );
    }

    if (monitors == null) return;
    const primaryMonitor = monitors?.find((monitor) => monitor.includes('<primary>yes</primary>'));
    const scale = primaryMonitor?.match(/<scale>([\d.]+)</)?.[1];

    return scale ? Number.parseFloat(scale) : undefined;
  }

  return;
}
