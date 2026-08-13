import { test, expect } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createIssue, claimIssue, findIssue, isStaleClaim } from "../../src/commands/issue";
import { ensureStoreDirs } from "../../src/store/repository";
import { DEFAULT_CONFIG } from "../../src/config/config";

const makeStore = (suffix: string) => {
  const dir = join(tmpdir(), `qtk-claim-${Date.now()}-${suffix}`);
  mkdirSync(dir, { recursive: true });
  ensureStoreDirs(dir);
  return dir;
};

test("claimIssue: クレームすると assignee + status + lease が設定される", async () => {
  const dir = makeStore("claim");
  try {
    const { id } = await createIssue(dir, DEFAULT_CONFIG, { title: "テスト" });
    await claimIssue(dir, DEFAULT_CONFIG, id, { as: "agent-a" });

    const found = await findIssue(dir, id);
    expect(found?.record.frontmatter.claimed_by).toBe("agent-a");
    expect(found?.record.frontmatter.status).toBe("in-progress");
    expect(found?.record.frontmatter.claimed_at).toBeDefined();
    expect(found?.record.frontmatter.lease_expires_at).toBeDefined();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("claimIssue: 既にクレーム済みで lease 有効ならエラー", async () => {
  const dir = makeStore("conflict");
  try {
    const { id } = await createIssue(dir, DEFAULT_CONFIG, { title: "テスト" });
    await claimIssue(dir, DEFAULT_CONFIG, id, { as: "agent-a" });
    await expect(claimIssue(dir, DEFAULT_CONFIG, id, { as: "agent-b" })).rejects.toThrow(
      "クレーム中",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("claimIssue: lease 期限切れなら再クレームできる", async () => {
  const dir = makeStore("stale");
  try {
    const { id } = await createIssue(dir, DEFAULT_CONFIG, { title: "テスト" });
    await claimIssue(dir, DEFAULT_CONFIG, id, { as: "agent-a" });

    // lease を過去に書き換え
    const found = await findIssue(dir, id);
    const past = new Date(Date.now() - 1000).toISOString();
    const content = await Bun.file(join(dir, "issues", `0001-${found!.slug}.md`)).text();
    const updated = content.replace(
      /lease_expires_at:.*/,
      `lease_expires_at: "${past}"`,
    );
    await Bun.write(join(dir, "issues", `0001-${found!.slug}.md`), updated);

    // stale 判定
    const found2 = await findIssue(dir, id);
    expect(isStaleClaim(found2!.record)).toBe(true);

    // 再クレームできる
    await claimIssue(dir, DEFAULT_CONFIG, id, { as: "agent-b" });
    const found3 = await findIssue(dir, id);
    expect(found3?.record.frontmatter.claimed_by).toBe("agent-b");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("claimIssue: 並列クレームで衝突しない", async () => {
  const dir = makeStore("parallel");
  try {
    const { id } = await createIssue(dir, DEFAULT_CONFIG, { title: "テスト" });
    const results = await Promise.allSettled([
      claimIssue(dir, DEFAULT_CONFIG, id, { as: "agent-a" }),
      claimIssue(dir, DEFAULT_CONFIG, id, { as: "agent-b" }),
      claimIssue(dir, DEFAULT_CONFIG, id, { as: "agent-c" }),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected").length;
    expect(fulfilled).toBe(1);
    expect(rejected).toBe(2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, { timeout: 30000 });
