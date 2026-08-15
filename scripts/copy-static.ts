// ビルド時に静的ファイルを dist/web/static へコピーするスクリプト
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "src", "web", "static");
const DEST = join(import.meta.dir, "..", "dist", "web", "static");

mkdirSync(DEST, { recursive: true });
let count = 0;
for (const file of readdirSync(SRC)) {
  copyFileSync(join(SRC, file), join(DEST, file));
  count++;
}
console.log(`Copied ${count} static file(s) to ${DEST}`);
