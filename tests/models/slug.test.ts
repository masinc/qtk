import { expect, test } from "bun:test";
import { slugify, uniqueSlug } from "../../src/models/slug";

test("slugify: 英語タイトルは kebab-case になる", () => {
  expect(slugify("Add Auth System")).toBe("add-auth-system");
  expect(slugify("Hello World!")).toBe("hello-world");
  expect(slugify("  Trim  Spaces  ")).toBe("trim-spaces");
});

test("slugify: 日本語タイトルはハッシュフォールバック", () => {
  const slug = slugify("認証機能を追加");
  expect(slug).toMatch(/^jp-[0-9a-f]{8}$/);
});

test("slugify: 空文字は untitled", () => {
  expect(slugify("")).toBe("untitled");
  expect(slugify("!!!")).toBe("untitled");
});

test("uniqueSlug: 衝突時にサフィックスを付加する", () => {
  const existing = new Set(["add-auth-system", "add-auth-system-2"]);
  expect(uniqueSlug("add-auth-system", existing)).toBe("add-auth-system-3");
  expect(uniqueSlug("new-feature", existing)).toBe("new-feature");
});
