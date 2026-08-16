// ファイルロック (proper-lockfile の mkdir 方式)
// Windows / Unix 両対応。並列プロセスでの原子的採番・claim に使用。
import lockfile from "proper-lockfile";

export interface LockOptions {
  timeout?: number;
  retryInterval?: number;
  stale?: number;
}

const DEFAULT_OPTIONS: LockOptions = {
  timeout: 10000,
  retryInterval: 100,
  stale: 10000,
};

export async function withFileLock<T>(
  lockPath: string,
  fn: () => Promise<T>,
  options: LockOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const release = await lockfile.lock(lockPath, {
    realpath: false,
    retries: {
      retries: Math.max(1, Math.ceil((opts.timeout ?? 10000) / (opts.retryInterval ?? 100))),
      minTimeout: opts.retryInterval,
      maxTimeout: opts.retryInterval,
      retryableError: (err: unknown) => (err as { code?: string })?.code === "ELOCKED",
    } as never,
    stale: opts.stale,
    update: Math.max(1000, (opts.stale ?? 10000) / 2),
  });
  try {
    return await fn();
  } finally {
    await release();
  }
}

export async function isLocked(lockPath: string): Promise<boolean> {
  try {
    return await lockfile.check(lockPath, { stale: DEFAULT_OPTIONS.stale });
  } catch {
    return false;
  }
}
