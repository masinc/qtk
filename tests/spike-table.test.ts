// T02 スパイク検証: cli-table3 の日本語テーブルテスト

import { expect, test } from "bun:test";
import Table from "cli-table3";

test("cli-table3: 日本語を含むテーブルが表示できる", () => {
  const table = new Table({
    head: ["ID", "タイトル", "ステータス"],
    style: { head: [], border: [] },
  });
  table.push(["#0001", "認証機能を追加", "new"]);
  table.push(["#0002", "ユーザー管理機能を追加する", "in-progress"]);

  const output = table.toString();
  expect(output).toContain("#0001");
  expect(output).toContain("認証機能を追加");
  expect(output).toContain("ユーザー管理機能を追加する");
  expect(output).toContain("new");
});

test("cli-table3: 空のカラム幅でも崩れない", () => {
  const table = new Table({
    style: { head: [], border: [] },
  });
  table.push(["#0001", "日本語テスト"]);
  const output = table.toString();
  expect(output).toContain("日本語テスト");
});
