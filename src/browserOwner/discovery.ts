import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getAppDataPath } from '../paths';

/**
 * AWRIT_USER_DATA_DIR gives an owner its own Chromium profile directory, and with it
 * its own single-instance lock and socket: a second build can then run beside the
 * first instead of being refused by it. Absolute only, so clients started in different
 * directories agree on the owner.
 */
export function ownerUserDataDir(env: Record<string, string | undefined> = process.env): string | undefined {
  const dir = env.AWRIT_USER_DATA_DIR;
  if (!dir) return undefined;
  if (!path.isAbsolute(dir)) {
    throw new Error(`AWRIT_USER_DATA_DIR must be an absolute path, found ${JSON.stringify(dir)}`);
  }
  return path.resolve(dir);
}

export function ownerSocketPath(): string {
  const userData = ownerUserDataDir();
  // Unset, the key is unchanged, so a running owner stays reachable across an upgrade.
  const key = userData ? `${getAppDataPath()}\0${userData}` : getAppDataPath();
  const identity = createHash('sha256').update(key).digest('hex').slice(0, 20);
  const name = `awrit-owner-${process.getuid?.() ?? os.userInfo().username}-${identity}`;
  let directory = path.join(process.env.XDG_RUNTIME_DIR || os.tmpdir(), name);
  // Darwin's sun_path has 104 bytes including its terminator; TMPDIR can be long.
  if (process.platform === 'darwin' && Buffer.byteLength(path.join(directory, 'terminal.sock')) >= 104) {
    directory = path.join('/tmp', name);
  }
  try {
    fs.mkdirSync(directory, { mode: 0o700 });
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
  }
  const stat = fs.lstatSync(directory);
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    stat.uid !== process.getuid?.() ||
    (stat.mode & 0o077) !== 0
  ) {
    throw new Error('Unsafe Awrit owner directory');
  }
  return path.join(directory, 'terminal.sock');
}
