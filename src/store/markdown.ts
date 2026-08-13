// frontmatter パース・シリアライズ
// Bun.YAML (組込) を使用。未知フィールドはオブジェクト全体を保持するため消失しない。
import { YAML } from "bun";

export interface ParsedRecord {
  frontmatter: Record<string, unknown>;
  body: string;
}

const FM_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseMarkdown(content: string): ParsedRecord {
  const match = content.match(FM_REGEX);
  if (match) {
    const yamlStr = match[1] ?? "";
    const body = match[2] ?? "";
    let frontmatter: Record<string, unknown> = {};
    if (yamlStr.trim() !== "") {
      const parsed = YAML.parse(yamlStr);
      frontmatter = (parsed ?? {}) as Record<string, unknown>;
    }
    return { frontmatter, body };
  }
  return { frontmatter: {}, body: content };
}

export function serializeMarkdown(record: ParsedRecord): string {
  const yamlStr = YAML.stringify(record.frontmatter, null, 2) ?? "";
  const fm = yamlStr.trim() === "" ? "" : `---\n${yamlStr}\n---\n\n`;
  return `${fm}${record.body}`;
}

export function updateFrontmatter(
  record: ParsedRecord,
  updates: Record<string, unknown>,
): ParsedRecord {
  return {
    frontmatter: { ...record.frontmatter, ...updates },
    body: record.body,
  };
}
