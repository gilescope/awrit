import { expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('macOS owner socket fits the Unix socket path limit with a long TMPDIR', () => {
  // Keep the host's data and owner sockets out of this subprocess's lookup.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'awrit-darwin-discovery-test-'));
  const temp = path.join(root, 'private', 'var', 'folders', 'ab', 'x'.repeat(32), 'T');
  fs.mkdirSync(temp, { recursive: true });
  const data = path.join(root, 'data');
  try {
    const result = Bun.spawnSync([
      process.execPath, '-e',
      `Object.defineProperty(process, 'platform', { value: 'darwin' });
       const { ownerSocketPath } = await import(${JSON.stringify(path.join(import.meta.dir, 'discovery.ts'))});
       console.log(ownerSocketPath());`,
    ], { env: { ...process.env, TMPDIR: temp, XDG_RUNTIME_DIR: '', XDG_DATA_HOME: data } });
    expect(result.exitCode).toBe(0);
    expect(Buffer.byteLength(result.stdout.toString().trim())).toBeLessThan(104);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    const identity = createHash('sha256').update(path.join(data, 'awrit')).digest('hex').slice(0, 20);
    const fallback = path.join('/tmp', `awrit-owner-${process.getuid?.()}-${identity}`);
    if (fs.existsSync(fallback)) fs.rmdirSync(fallback);
  }
});

test('owner discovery survives different shell temporary directories', () => {
  // Keep this test on the XDG runtime path; the test above covers Darwin's fallback.
  const tempRoot = process.platform === 'darwin' ? '/tmp' : os.tmpdir();
  const root = fs.mkdtempSync(path.join(tempRoot, 'awrit-discovery-test-'));
  try {
    const runtime = path.join(root, 'runtime');
    fs.mkdirSync(runtime, { mode: 0o700 });
    const sockets = ['shell-a', 'shell-b'].map((shell) => {
      const temp = path.join(root, shell);
      fs.mkdirSync(temp);
      const result = Bun.spawnSync([
        process.execPath, '-e',
        `import { ownerSocketPath } from ${JSON.stringify(path.join(import.meta.dir, 'discovery.ts'))}; console.log(ownerSocketPath());`,
      ], { env: { ...process.env, TMPDIR: temp, XDG_RUNTIME_DIR: runtime, XDG_DATA_HOME: path.join(root, 'data') } });
      expect(result.exitCode).toBe(0);
      return result.stdout.toString().trim();
    });
    expect(sockets[0]).toBe(sockets[1]);
    expect(sockets[0].startsWith(runtime + path.sep)).toBe(true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('AWRIT_USER_DATA_DIR names the owner profile directory, and must be absolute', async () => {
  const { ownerUserDataDir } = await import('./discovery');
  expect(ownerUserDataDir({})).toBeUndefined();
  expect(ownerUserDataDir({ AWRIT_USER_DATA_DIR: '' })).toBeUndefined();
  expect(ownerUserDataDir({ AWRIT_USER_DATA_DIR: '/data/trial/' })).toBe('/data/trial');
  // Clients started in different directories must agree on the owner.
  expect(() => ownerUserDataDir({ AWRIT_USER_DATA_DIR: 'trial' })).toThrow(
    'AWRIT_USER_DATA_DIR must be an absolute path, found "trial"',
  );
});

test('an owner with its own profile directory has its own socket', () => {
  const tempRoot = process.platform === 'darwin' ? '/tmp' : os.tmpdir();
  const root = fs.mkdtempSync(path.join(tempRoot, 'awrit-discovery-test-'));
  try {
    const runtime = path.join(root, 'runtime');
    fs.mkdirSync(runtime, { mode: 0o700 });
    const socket = (userData?: string) => {
      const env: Record<string, string | undefined> = {
        ...process.env, XDG_RUNTIME_DIR: runtime, XDG_DATA_HOME: path.join(root, 'data'),
        AWRIT_USER_DATA_DIR: userData,
      };
      if (userData === undefined) delete env.AWRIT_USER_DATA_DIR;
      const result = Bun.spawnSync([
        process.execPath, '-e',
        `import { ownerSocketPath } from ${JSON.stringify(path.join(import.meta.dir, 'discovery.ts'))}; console.log(ownerSocketPath());`,
      ], { env });
      expect(result.exitCode).toBe(0);
      return result.stdout.toString().trim();
    };
    const trial = path.join(root, 'trial');
    expect(socket(trial)).not.toBe(socket());
    expect(socket(trial)).toBe(socket(trial + path.sep));
    expect(socket(trial)).not.toBe(socket(path.join(root, 'other')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
