// slug 生成 (タイトルから kebab-case、日本語はハッシュフォールバック)
import { createHash } from "node:crypto";

export function slugify(title: string): string {
  const normalized = title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized === "") return "untitled";

  // 日本語を含む場合はハッシュフォールバック
  if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(normalized)) {
    const hash = createHash("md5").update(title).digest("hex").slice(0, 8);
    return `jp-${hash}`;
  }

  return normalized;
}

export function uniqueSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
