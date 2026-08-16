import { expect, test } from "bun:test";
import { renderTable } from "../../src/output/table";

test("renderTable: 日本語を含むテーブルが表示できる", () => {
  const output = renderTable(
    ["ID", "タイトル", "ステータス"],
    [
      ["#0001", "認証機能を追加", "new"],
      ["#0002", "ユーザー管理機能を追加する", "in-progress"],
    ],
  );
  expect(output).toContain("#0001");
  expect(output).toContain("認証機能を追加");
  expect(output).toContain("ユーザー管理機能を追加する");
  expect(output).toContain("in-progress");
});

test("renderTable: 空の行でも崩れない", () => {
  const output = renderTable(["ID", "タイトル"], []);
  expect(output).toContain("ID");
});
