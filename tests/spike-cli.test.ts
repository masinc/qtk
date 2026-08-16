// T02 スパイク検証: citty の引数パーステスト

import { expect, test } from "bun:test";
import { defineCommand, runCommand } from "citty";

const issue = defineCommand({
  meta: { name: "issue", description: "チケット管理" },
  args: {
    action: { type: "positional", description: "アクション", required: true },
    title: { type: "positional", description: "タイトル", required: false },
    description: { alias: "d", type: "string", description: "説明" },
    tag: { type: "string", description: "タグ" },
    dep: { type: "string", description: "依存ID" },
    json: { type: "boolean", default: false, description: "JSON 出力" },
  },
  run({ args }) {
    return args;
  },
});

const root = defineCommand({
  meta: { name: "qtk", description: "qtk CLI" },
  subCommands: { issue },
});

test("citty: サブコマンド + 位置引数 + オプションを分離できる", async () => {
  const result = (await runCommand(issue, {
    rawArgs: ["create", "認証機能を追加", "-d", "説明", "--tag", "backend", "--dep", "0002"],
  })) as unknown as { result: Record<string, unknown> };
  expect(result?.result?.action).toBe("create");
  expect(result?.result?.title).toBe("認証機能を追加");
  expect(result?.result?.description).toBe("説明");
  expect(result?.result?.tag).toBe("backend");
  expect(result?.result?.dep).toBe("0002");
});

test("citty: boolean オプションとデフォルト値", async () => {
  const result = (await runCommand(issue, {
    rawArgs: ["list", "--json"],
  })) as unknown as { result: Record<string, unknown> };
  expect(result?.result?.json).toBe(true);
});

test("citty: ルートからサブコマンド解決できる", async () => {
  const resolved = await runCommand(root, {
    rawArgs: ["issue", "list", "--json"],
  });
  expect(resolved).toBeDefined();
});
