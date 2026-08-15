# Release Guide

`@masinc/qtk` のリリース手順。npm への公開には **`bun publish`** を使用する (`npm publish` ではない)。

## 前提

- [Bun](https://bun.sh) がインストールされていること
- npm アカウント `masinc` が 2 要素認証 (OTP) 有効で設定済みであること
- `bun login` で npm レジストリにログイン済みであること (初回のみ)

```bash
bun login
# → Username: masinc
# → Password: ********
# → Email: (公開用メールアドレス)
```

## バージョン番号の更新

**2 箇所** を同バージョンに揃える (ハードコードされているため自動連動しない):

1. `package.json` — `"version": "x.y.z"`
2. `src/cli-main.ts` — `defineCommand` の `meta.version: "x.y.z"`

例: `0.1.1` → `0.2.0`

```diff
// package.json
- "version": "0.1.1",
+ "version": "0.2.0",
```

```diff
// src/cli-main.ts
- version: "0.1.1",
+ version: "0.2.0",
```

### バージョン番号の決め方 ([Semantic Versioning](https://semver.org/lang/ja/))

- **PATCH** (`0.1.1` → `0.1.2`): バグ修正・内部改善。後方互換性あり。
- **MINOR** (`0.1.1` → `0.2.0`): 新機能追加。後方互換性あり。
- **MAJOR** (`0.x` → `1.0.0`): 破壊的変更。後方互換性なし。
- 0.y.z の間はマイナーでも破壊的変更を許容する (初期開発段階)。

ストアのパス (`.qtk/` 等) や `config.yaml` のスキーマなど、既存ユーザが再 `init` を必要とする変更は破壊的扱いとする。

## CHANGELOG.md の更新

[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) 形式で新エントリを先頭に追加する。リリース日付は YYYY-MM-DD 形式 (リリース実施日)。

```markdown
## [x.y.z] - YYYY-MM-DD

### Added
- 新機能を簡潔に。

### Changed
- 変更点。破壊的変更は **Breaking** と明記。

### Fixed
- バグ修正。

### Removed
- 削除した機能。
```

リンクセクションの末尾に新バージョンの比較リンクを追加する:

```markdown
[x.y.z]: https://github.com/masinc/qtk/compare/v0.1.1...vx.y.z
```

## 検証

publish 前に以下を全て PASS させる (`prepublishOnly` スクリプトで自動実行されるが、事前確認推奨):

```bash
# テスト (95 期待)
bun test

# 型チェック
bun run typecheck
# または: tsc --noEmit

# ビルド (dist/cli.js 生成)
bun run build

# 公開内容の確認 (LICENSE / CHANGELOG.md / dist/ / src/ / README.md / package.json のみ)
bun publish --dry-run --access public
```

`bun publish --dry-run` で以下を必ず確認:
- バージョン番号が意図通り
- `dist/cli.js` が含まれる (bin エントリ)
- `LICENSE` と `CHANGELOG.md` が含まれる
- `src/` 配下の全ファイルが含まれる
- `index.ts` (scaffold 残骸) が含まれない (削除済み)
- `tests/` が含まれない (`files` フィールドで制限)
- `bun.lock` が含まれない
- `RELEASE.md` が含まれない (`files` フィールドで制限、開発者向けドキュメントのため publish 対象外)

## リリースの実行

### 1. コミット

```bash
git add -A
git commit -m "chore(release): vx.y.z"
```

### 2. タグ付け

annotated tag を作成 (lightweight tag ではなくメッセージ付き):

```bash
git tag -a vx.y.z -m "vx.y.z"
```

### 3. push

```bash
git push origin main
git push origin vx.y.z
```

### 4. publish

**`bun publish`** を使用 (`npm publish` ではない):

```bash
# OTP 認証アプリの 6 桁コードを指定する場合
bun publish --access public --otp=123456

# ブラウザ認証 (デフォルト) で OTP を自動取得する場合
bun publish --access public
# → 認証 URL が表示されるのでブラウザで開き、認証完了後に publish が進む
```

`bun publish` の特徴:
- `prepublishOnly` (`bun test && tsc --noEmit && bun run build`) が自動実行される
- OTP 認証を `--otp` または `--auth-type` (`web` / `auto`) でサポート
- `--access public` で scoped package を公開公開 (`@masinc/qtk` は scoped なので必須)

### 5. 公開確認

```bash
# npm レジストリの表示確認
bun pm view @masinc/qtk

# または
npm view @masinc/qtk
```

バージョン、tarball サイズ、公開日時、`dist-tags.latest` が新バージョンになっていることを確認。

## リリース後の作業 (オプション)

- GitHub Release を作成する: タグ `vx.y.z` をベースに CHANGELOG の該当バージョン内容を Release Notes にする。
  ```bash
  gh release create vx.y.z --notes-from-tag --title "vx.y.z"
  ```
- 公開したバージョンで動作確認:
  ```bash
  bunx @masinc/qtk@x.y.z --help
  bunx @masinc/qtk@x.y.z issue list
  ```

## トラブルシューティング

### `EOTP` / one-time password 要求

`bun publish` が OTP を要求して中断した場合:
- `--otp=<6 桁>` を付けて再実行、または
- `--auth-type=web` (デフォルト) でブラウザ認証 URL を開き、認証後に publish が進む

### `EPUBLISHCONFLICT` / 既存バージョン衝突

同一バージョンを再公開しようとした場合:
- バージョン番号を上げ直すのが基本。
- 開発中の再公開なら `--tolerate-republish` で上書き可能 (本番運用では非推奨)。

### `prepublishOnly` でテストが落ちる

`bun test` が失敗すると publish が中断される。テストを修正してから再実行。検証ステップを先に行っていればここで止まることは稀。

### `dist/cli.js` が古い

`bun run build` を手動実行してから `bun publish --dry-run` で差分確認。`prepublishOnly` が必ずビルドを実行するので通常は問題ないが、`--ignore-scripts` を付けるとビルドが走らないので注意。

### `tsc` が見つからない (`bun: command not found: tsc`)

`bun publish` は `node_modules/.bin` を PATH に追加しないため、`prepublishOnly` 内で `tsc --noEmit` を直接呼ぶと失敗する。`bun run typecheck` 経由で実行すること (`package.json` の `typecheck` スクリプトが `tsc --noEmit` を参照)。

```jsonc
// ✅ OK: bun run 経由で呼ぶ
"prepublishOnly": "bun test && bun run typecheck && bun run build"

// ❌ NG: 直接 tsc を呼ぶと bun では PATH 解決できない
"prepublishOnly": "bun test && tsc --noEmit && bun run build"
```

CI 環境では `bun install` 後に `node_modules/.bin/tsc` が存在するが、bun のスクリプト実行では `node_modules/.bin` が PATH に含まれないため、同じ問題が起きる。必ず `bun run <script>` 経由で呼ぶこと。

## 自動化のヒント

将来の改善案 (現状は手動):
- `package.json` と `src/cli-main.ts` のバージョン同期をスクリプト化 (例: `scripts/bump-version.ts`)。
- GitHub Actions でタグ push をトリガーに `bun publish` を自動実行 (OTP は環境変数 or `NPM_CONFIG_otp` 経由で供給)。
- リリース PR ベース運理に移行し、CHANGELOG を PR 上で蓄積。

## 参照

- [bun publish ドキュメント](https://bun.com/docs/cli/publish)
- [Semantic Versioning](https://semver.org/lang/ja/)
- [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/)
- [npm 2FA 設定](https://docs.npmjs.com/configuring-two-factor-authentication)