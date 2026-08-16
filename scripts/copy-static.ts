// ビルド時に静的ファイルを dist/web/static へコピーするスクリプト
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "web", "dist");
const DEST = join(import.meta.dir, "..", "dist", "web", "static");

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });
cpSync(SRC, DEST, { recursive: true });
console.log(`Copied static files from ${SRC} to ${DEST}`);
