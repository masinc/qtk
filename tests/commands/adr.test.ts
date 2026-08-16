import { expect, test } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { editAdr, findAdr, newAdr, validateAdrs } from "../../src/commands/adr";
import { DEFAULT_CONFIG } from "../../src/config/config";
import { ensureStoreDirs } from "../../src/store/repository";

const makeStore = (suffix: string) => {
  const dir = join(tmpdir(), `qtk-adr-${Date.now()}-${suffix}`);
  mkdirSync(dir, { recursive: true });
  ensureStoreDirs(dir);
  return dir;
};

test("newAdr: ADR を作成しテンプレートを生成する", async () => {
  const dir = makeStore("new");
  try {
    const { id } = await newAdr(dir, DEFAULT_CONFIG, {
      title: "データベース選定",
      description: "DB を選定する",
      tags: ["architecture"],
    });
    expect(id).toBe(1);

    const found = await findAdr(dir, id);
    expect(found?.record.frontmatter.status).toBe("proposed");
    expect(found?.record.frontmatter.tags).toEqual(["architecture"]);
    expect(found?.record.body).toContain("## Context");
    expect(found?.record.body).toContain("## Decision");
    expect(found?.record.body).toContain("## Consequences");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("newAdr: supersedes 指定で旧 ADR を自動更新する", async () => {
  const dir = makeStore("supersedes");
  try {
    const old = await newAdr(dir, DEFAULT_CONFIG, { title: "旧設計" });
    const fresh = await newAdr(dir, DEFAULT_CONFIG, { title: "新設計", supersedes: old.id });

    const oldFound = await findAdr(dir, old.id);
    expect(oldFound?.record.frontmatter.status).toBe("superseded");
    expect(oldFound?.record.frontmatter.superseded_by).toBe(fresh.id);

    const freshFound = await findAdr(dir, fresh.id);
    expect(freshFound?.record.frontmatter.supersedes).toBe(old.id);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("editAdr: ステータス・タグを更新できる", async () => {
  const dir = makeStore("edit");
  try {
    const { id } = await newAdr(dir, DEFAULT_CONFIG, { title: "テスト", tags: ["a"] });
    await editAdr(dir, DEFAULT_CONFIG, id, {
      status: "accepted",
      addTags: ["b"],
    });

    const found = await findAdr(dir, id);
    expect(found?.record.frontmatter.status).toBe("accepted");
    expect(found?.record.frontmatter.tags).toEqual(["a", "b"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("adrTags: タグと使用数を集計する", async () => {
  const dir = makeStore("tags");
  try {
    await newAdr(dir, DEFAULT_CONFIG, { title: "A", tags: ["architecture", "db"] });
    await newAdr(dir, DEFAULT_CONFIG, { title: "B", tags: ["architecture"] });

    const counts = new Map<string, number>();
    const files = await import("../../src/commands/adr").then((m) => m.listAdrFiles(dir));
    for (const f of files) {
      for (const t of (f.record.frontmatter.tags as string[]) ?? []) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    expect(counts.get("architecture")).toBe(2);
    expect(counts.get("db")).toBe(1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("validateAdrs: 参照整合性をチェックする", async () => {
  const dir = makeStore("validate");
  try {
    const { id } = await newAdr(dir, DEFAULT_CONFIG, { title: "テスト" });
    const found = await findAdr(dir, id);
    const broken = `---
id: ${id}
type: adr
title: "テスト"
status: "invalid-status"
tags:
  - "BAD TAG"
supersedes: 999
---
本文`;
    await Bun.write(join(dir, "adrs", `0001-${found?.slug}.md`), broken);

    const issues = await validateAdrs(dir);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.field === "status")).toBe(true);
    expect(issues.some((i) => i.field === "tags")).toBe(true);
    expect(issues.some((i) => i.field === "supersedes")).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
