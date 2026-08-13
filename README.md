# qtk

ローカル issue / ADR / spec / plan 統合管理 CLI ツール。

Markdown ファイル (YAML frontmatter 付き) をストアとして、チケット・アーキテクチャ決定記録・仕様・計画を単一ツールで管理します。git でバージョン管理可能です。

> **注意**: qtk は **Bun ランタイム必須** です。`bunx qtk` で実行してください。`npx` では動作しません。

## インストール

```bash
# bun が必要です (https://bun.sh)
bunx qtk --help
```

## クイックスタート

```bash
# ストア初期化 (qtk/ ディレクトリと config.yml を作成)
bunx qtk init

# チケット作成
bunx qtk issue create "認証機能を追加" -d "ユーザー認証を実装" --tag backend --ac "ログイン画面がある"

# チケット一覧
bunx qtk issue list

# チケット詳細
bunx qtk issue show 1

# チケット編集 (ステータス・タグ・コメント)
bunx qtk issue edit 1 --status in-progress --add-tag auth --comment "実装開始"

# ADR 作成
bunx qtk adr new "データベース選定" -d "DB を選定する" --tag architecture

# 計画作成 (AI Agent の plan 履歴管理)
bunx qtk plan create "qtk ツール構築" --generated-by claude

# 横断検索
bunx qtk search "認証"
```

## コマンド一覧

| コマンド | 説明 |
|---|---|
| `qtk init` | ストアを初期化 (`qtk/` ディレクトリ + `config.yml`) |
| `qtk issue create "タイトル" [-d 説明] [--ac 基準] [--tag タグ] [--assignee 名前] [--dep 依存ID]` | チケット作成 |
| `qtk issue list [-s ステータス] [-a 担当者] [--tag タグ] [--ready] [--blocked] [--search キーワード] [--limit n] [--json]` | チケット一覧 |
| `qtk issue show <ID> [--json]` | チケット詳細 |
| `qtk issue edit <ID> [-d 説明] [--ac 基準] [--plan 計画] [--comment 本文] [--tag タグ] [--add-tag タグ] [--remove-tag タグ] [--clear-tags] [--assignee 名前] [--dep 依存ID] [--status ステータス] [--final-summary サマリー]` | チケット編集 |
| `qtk issue archive <ID>` | チケットをアーカイブ |
| `qtk adr new "タイトル" [-d 要約] [--tag タグ] [--status ステータス] [--supersedes 旧ADR ID]` | ADR 作成 |
| `qtk adr list [--tag タグ] [--status ステータス] [--json]` | ADR 一覧 |
| `qtk adr show <ID> [--json]` | ADR 詳細 |
| `qtk adr edit <ID> [--status ステータス] [--tag タグ] [--add-tag タグ] [--remove-tag タグ] [--supersedes 旧ADR ID] [--superseded-by 新ADR ID] [--title タイトル] [--description 要約]` | ADR 編集 |
| `qtk adr tags [--json]` | ADR タグ一覧 |
| `qtk adr validate` | ADR バリデーション |
| `qtk spec create "タイトル" [--type 種別] [-d 説明]` | 仕様作成 |
| `qtk spec list [--type 種別] [--json]` | 仕様一覧 |
| `qtk spec show <ID> [--json]` | 仕様詳細 |
| `qtk spec update <ID> [--content 本文] [--plain]` | 仕様の本文更新 |
| `qtk plan create "タイトル" [-d 要約] [--related-issue ID] [--related-adr ID] [--generated-by エージェント] [--status ステータス]` | 計画作成 |
| `qtk plan list [--status ステータス] [--related-issue ID] [--json]` | 計画一覧 |
| `qtk plan show <ID> [--json]` | 計画詳細 |
| `qtk plan edit <ID> [--status ステータス] [--related-issue ID] [--related-adr ID] [--supersedes 旧計画ID] [--title タイトル] [--description 要約]` | 計画編集 |
| `qtk plan archive <ID>` | 計画をアーカイブ |
| `qtk tags [--json]` | 全種別のタグ一覧 |
| `qtk search "キーワード" [--type 種別] [--status ステータス] [--tag タグ] [--limit n] [--json]` | 横断検索 |

## ステータス

| 種別 | ステータス |
|---|---|
| issue | `new` → `in-progress` → `paused` → `done` |
| adr | `proposed` → `accepted` / `deprecated` / `superseded` |
| plan | `drafting` → `ready` → `in-progress` → `completed` / `superseded` / `abandoned` |

## ストア構成

```
<repo-root>/qtk/
├── config.yml              # 設定ファイル
├── issues/                 # チケット (0001-slug.md)
├── adrs/                   # ADR (0002-slug.md)
├── specs/                  # 仕様 (0003-slug.md)
├── plans/                  # 計画 (0004-slug.md)
├── archive/                # アーカイブ済み
└── .qtk/                   # 内部管理 (counter.json, counter.lock)
```

- 全種別で共通採番 (`#0001` 形式、デフォルト4桁)
- ファイル名は `<NNNN>-<slug>.md`
- 採番はファイルロックで原子的 (並列セッションでも ID 衝突なし)

## 設定 (config.yml)

```yaml
version: "1.0"
idDigits: 4                    # ID の桁数
defaultStatus: "new"           # issue のデフォルトステータス
statuses:                       # issue のステータス定義
  - new
  - in-progress
  - paused
  - done
adrStatuses:                    # ADR のステータス定義
  - proposed
  - accepted
  - deprecated
  - superseded
planStatuses:                   # plan のステータス定義
  - drafting
  - ready
  - in-progress
  - completed
  - superseded
  - abandoned
```

## Windows / PowerShell での注意

PowerShell 5.1 で日本語が文字化けする場合は、以下を実行してください:

```powershell
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

## 開発

```bash
bun install        # 依存インストール
bun test           # テスト実行
bun run cli.ts     # 開発実行
```

## ライセンス

MIT
