// テーブル出力 (cli-table3、日本語対応)
import Table from "cli-table3";

export interface TableColumn {
  head: string;
  width?: number;
}

export function renderTable(headers: string[], rows: (string | number)[][]): string {
  const table = new Table({
    head: headers,
    style: { head: [], border: [] },
  });
  for (const row of rows) {
    table.push(row);
  }
  return table.toString();
}
