# qtk

ローカル issue / ADR / spec / plan 統合管理 CLI ツール。

Markdown ファイル (YAML frontmatter 付き) をストアとして、チケット・アーキテクチャ決定記録・仕様・計画を単一ツールで管理します。git でバージョン管理可能です。

> **注意**: qtk は **Bun ランタイム必須** です。`bunx @masinc/qtk` で実行してください。`npx` では動作しません。

## インストール

```bash
# bun が必要です (https://bun.sh)
bunx @masinc/qtk --help
```

## クイックスタート

```bash
# ストア初期化 (.qtk/ ディレクトリと config.yaml を作成)
bunx @masinc/qtk init

# チケット作成
bunx @masinc/qtk issue create "認証機能を追加" -d "ユーザー認証を実装" --tag backend --ac "ログイン画面がある"

# チケット一覧
bunx @masinc/qtk issue list

# チケット詳細
bunx @masinc/qtk issue show 1

# チケット編集 (ステータス・タグ・コメント)
bunx @masinc/qtk issue edit 1 --status in-progress --add-tag auth --comment "実装開始"

# ADR 作成
bunx @masinc/qtk adr new "データベース選定" -d "DB を選定する" --tag architecture

# 計画作成 (AI Agent の plan 履歴管理)
bunx @masinc/qtk plan create "qtk ツール構築" --generated-by claude

# 横断検索
bunx @masinc/qtk search "認証"
```

## コマンド一覧

| コマンド | 説明 |
|---|---|
| `qtk init` | ストアを初期化 (`.qtk/` ディレクトリ + `config.yaml` + `.gitignore`) |
| `qtk issue create "タイトル" [-d 説明] [--ac 基準] [--tag タグ] [--assignee 名前] [--dep 依存ID]` | チケット作成 |
| `qtk issue list [-s ステータス] [-a 担当者] [--tag タグ] [--ready] [--blocked] [--search キーワード] [--limit n] [--json]` | チケット一覧 |
| `qtk issue show <ID> [--json]` | チケット詳細 |
| `qtk issue edit <ID> [-d 説明] [--ac 基準] [--plan 計画] [--comment 本文] [--tag タグ] [--add-tag タグ] [--remove-tag タグ] [--clear-tags] [--assignee 名前] [--dep 依存ID] [--status ステータス] [--final-summary サマリー]` | チケット編集 |
| `qtk issue archive <ID>` | チケットをアーカイブ |
| `qtk issue claim <ID> [--as 名前]` | チケットをクレーム (原子的、lease 付き) |
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
| `qtk graph [--plan ID] [--cycles] [--format text\|dot\|json]` | 依存グラフ表示・循環依存検出 |
| `qtk web [--port ポート] [--no-open]` | Web UI / Kanban を起動 (http://127.0.0.1:3000) |
| `qtk migrate-adr <ソースディレクトリ> [--dry-run]` | Python 製 ADR CLI から移行 |

## ステータス

| 種別 | ステータス |
|---|---|
| issue | `new` → `in-progress` → `paused` → `done` |
| adr | `proposed` → `accepted` / `deprecated` / `superseded` |
| plan | `drafting` → `ready` → `in-progress` → `completed` / `superseded` / `abandoned` |

## ストア構成

```
<repo-root>/.qtk/
├── config.yaml             # 設定ファイル
├── issues/                  # チケット (0001-slug.md)
├── adrs/                    # ADR (0002-slug.md)
├── specs/                   # 仕様 (0003-slug.md)
├── plans/                   # 計画 (0004-slug.md)
├── archive/                 # アーカイブ済み
├── .meta/                   # 内部管理 (counter.json, *.lock)
└── .gitignore               # *.lock を除外 (init 時に自動生成)
```

- 全種別で共通採番 (`#0001` 形式、デフォルト4桁)
- ファイル名は `<NNNN>-<slug>.md`
- 採番はファイルロックで原子的 (並列セッションでも ID 衝突なし)
- `counter.json` はバージョン管理対象、`*.lock` は gitignore 対象

## 設定 (config.yaml)

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
claimLeaseMinutes: 30           # claim の lease 期限 (分)
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

## スキル統合

qtk CLI は [masinc/skills](https://github.com/masinc/skills) リポジトリで配布されているスキル群と統合されています。以下のスキルが qtk CLI を選択肢としてサポートしています:

| スキル | 説明 |
|---|---|
| `setup-matt-pocock-skills` | リポジトリのセットアップ (イシュートラッカー・トリアージラベル・ドメイン文書)。qtk CLI を選択肢に追加 |
| `to-tickets` | 計画・仕様をトレーサーバレットチケットに分解。`qtk issue create` + `--dep` で構造化依存 |
| `to-spec` | 会話を仕様に変換。`qtk spec create` + `qtk spec update` で管理 |
| `triage` | イシューをトリアージロールで状態管理。`qtk issue edit --add-tag` / `--comment` / `--status` で操作 |
| `wayfinder` | 大規模作業を共有マップとして計画。`qtk plan create` (マップ) + `qtk issue list --ready` (フロンティア) + `qtk issue claim` (クレーム) |
| `implement` | 仕様・チケットに基づいて実装。`qtk issue list --ready` → `show --json` → `claim` → `edit --status done` のワークフロー |
| `qtk` | qtk CLI の包括的ガイド。issue / ADR / spec / plan の全コマンド・ワークフロー・データモデルを詳細に扱う |

スキルのインストール:

```bash
npx skills add https://github.com/masinc/skills.git -g
```

## ライセンス

MIT
