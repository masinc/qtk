# qtk CLI コマンドリファレンス

全コマンド・全オプションの完全リファレンスです。

> **実行形式**: `bunx @masinc/qtk <command>` (以下、表中では `qtk` と省略)

> **共通オプション**: ほぼ全コマンドで `--dir <path>` (ストアディレクトリを明示指定) が使用可能です。未指定時はカレントディレクトリから親方向へ `qtk/config.yml` を探索します。

> **配列系オプションの制限**: `--ac`、`--tag`、`--dep`、`--add-tag`、`--remove-tag`、`--assignee`、`--related-issue`、`--related-adr` は、現状1つしか指定できません (最後の値で上書き)。複数値が必要な場合は、作成後に Markdown ファイルを直接編集するか、`--add-tag` を複数回実行してください。

## 出力形式

各コマンドは `--json` オプションで機械可読な JSON を出力します (schemaVersion 付き):

```bash
bunx @masinc/qtk issue list --json
bunx @masinc/qtk issue show 1 --json
bunx @masinc/qtk adr list --json
bunx @masinc/qtk search "keyword" --json
```

JSON 出力はエージェントがパースして次のアクションを決定するために使用します。テーブル出力 (デフォルト) は人間向けのプレーンテキストです。

---

## init — ストア初期化

```
qtk init [--defaults] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `--defaults` | boolean | 非対話実行 (デフォルト値で初期化) |
| `--dir <path>` | string | ストアディレクトリを指定 |

`qtk/` ディレクトリと `config.yml`、サブディレクトリ (`issues/`, `adrs/`, `specs/`, `plans/`, `archive/`, `.qtk/`) を作成します。既に初期化済みの場合はエラーになります。

---

## issue — チケット管理

### issue create — チケット作成

```
qtk issue create <title> [-d <description>] [--ac <criterion>] [--tag <tag>] [--assignee <name>] [--dep <id>] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<title>` | positional (必須) | チケットタイトル |
| `-d, --description` | string | 説明 |
| `--ac` | string | 受け入れ基準 (※1つのみ。複数はファイル編集) |
| `--tag` | string | タグ (※1つのみ。複数は `edit --add-tag` で追加) |
| `--assignee` | string | 担当者 (※1つのみ) |
| `--dep` | string | 依存する issue ID (※1つのみ。複数はファイル編集) |
| `--dir` | string | ストアディレクトリ |

共通採番で ID が付与されます。frontmatter に `type: issue`, `status: new`, `tags`, `assignees`, `created_at`, `updated_at`, `dependencies`, `acceptance_criteria`, `definition_of_done`, `plan`, `comments`, `final_summary` が生成されます。本文に `## 説明` / `## 受け入れ基準` / `## コメント` テンプレートが生成されます。

### issue list — チケット一覧

```
qtk issue list [-s <status>] [-a <assignee>] [--tag <tag>] [--ready] [--blocked] [--stale] [--search <keyword>] [--limit <n>] [--json] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `-s, --status` | string | ステータスでフィルタ (`new`/`in-progress`/`paused`/`done`) |
| `-a, --assignee` | string | 担当者でフィルタ |
| `--tag` | string | タグでフィルタ |
| `--ready` | boolean | 実行可能なチケットのみ (全依存完了) |
| `--blocked` | boolean | ブロック中のチケットのみ (未完了依存あり) |
| `--stale` | boolean | lease 期限切れのクレームのみ |
| `--search` | string | キーワード検索 |
| `--limit` | string | 件数制限 |
| `--json` | boolean | JSON 出力 (schemaVersion 付き、依存フィールド含む) |

テーブル出力 (デフォルト): ID / タイトル / ステータス / タグ

### issue show — チケット詳細

```
qtk issue show <id> [--json] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<id>` | positional (必須) | チケット ID (`1` or `#0001` 形式) |
| `--json` | boolean | JSON 出力 (全フィールド + 本文) |

### issue edit — チケット編集

```
qtk issue edit <id> [-d <description>] [--ac <criterion>] [--plan <plan>] [--notes <notes>] [--comment <body>] [--comment-author <author>] [--tag <tag>] [--add-tag <tag>] [--remove-tag <tag>] [--clear-tags] [--assignee <name>] [--dep <id>] [--status <status>] [--final-summary <summary>] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<id>` | positional (必須) | チケット ID |
| `-d, --description` | string | 説明を更新 |
| `--ac` | string | 受け入れ基準を更新 (※配列置換、1つのみ) |
| `--plan` | string | 実装計画を更新 |
| `--notes` | string | メモを更新 |
| `--comment` | string | コメントを追記 |
| `--comment-author` | string | コメント投稿者 (デフォルト `@unknown`) |
| `--tag` | string | タグを置き換え (※配列置換) |
| `--add-tag` | string | タグを追加 (※1つのみ。複数回実行可) |
| `--remove-tag` | string | タグを削除 |
| `--clear-tags` | boolean | タグを全削除 |
| `--assignee` | string | 担当者を更新 |
| `--dep` | string | 依存 ID を更新 (※配列置換) |
| `--status` | string | ステータスを変更 (`new`/`in-progress`/`paused`/`done`) |
| `--final-summary` | string | 完了時サマリー |

> **カスタム frontmatter 保持**: 既知フィールドの更新時、未知フィールド (ユーザーが手動で追加したフィールド) は消失しません。

### issue archive — チケットアーカイブ

```
qtk issue archive <id> [--dir <path>]
```

チケットを `qtk/archive/` へ移動します。

### issue claim — チケットクレーム (原子的)

```
qtk issue claim <id> [--as <name>] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<id>` | positional (必須) | チケット ID |
| `--as` | string | クレーム者名 |

原子的クレーム (ファイルロック付き)。以下が同時に設定されます:
- `claimed_by` = クレーム者名
- `claimed_at` = 現在日時
- `lease_expires_at` = 現在日時 + `claimLeaseMinutes` 分
- `status` = `in-progress`

既にクレーム済みで lease 有効な場合はエラーになります。lease 期限切れの場合は再クレーム可能です。

---

## adr — ADR 管理

### adr new — ADR 作成

```
qtk adr new <title> [-d <description>] [--tag <tag>] [--status <status>] [--supersedes <old-id>] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<title>` | positional (必須) | ADR タイトル |
| `-d, --description` | string | 要約 (英語推奨 200文字以内) |
| `--tag` | string | タグ (※1つのみ) |
| `--status` | string | ステータス (デフォルト `proposed`) |
| `--supersedes` | string | 置き換える旧 ADR ID |

`--supersedes` 指定時、旧 ADR の `superseded_by` と `status: superseded` が自動更新されます (双方向参照整合性)。

本文に `## Context` / `## Decision` / `## Consequences` テンプレートが生成されます。

### adr list — ADR 一覧

```
qtk adr list [--tag <tag>] [--status <status>] [--json] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `--tag` | string | タグでフィルタ |
| `--status` | string | ステータスでフィルタ (`proposed`/`accepted`/`deprecated`/`superseded`) |
| `--json` | boolean | JSON 出力 |

### adr show — ADR 詳細

```
qtk adr show <id> [--json] [--dir <path>]
```

### adr edit — ADR 編集

```
qtk adr edit <id> [--status <status>] [--tag <tag>] [--add-tag <tag>] [--remove-tag <tag>] [--supersedes <old-id>] [--superseded-by <new-id>] [--title <title>] [--description <desc>] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<id>` | positional (必須) | ADR ID |
| `--status` | string | ステータスを変更 |
| `--tag` | string | タグを置き換え |
| `--add-tag` | string | タグを追加 |
| `--remove-tag` | string | タグを削除 |
| `--supersedes` | string | 置き換える旧 ADR ID (旧 ADR の superseded_by と status を自動更新) |
| `--superseded-by` | string | この ADR を置き換えた新 ADR ID |
| `--title` | string | タイトルを更新 |
| `--description` | string | 要約を更新 |

### adr tags — ADR タグ一覧

```
qtk adr tags [--json] [--dir <path>]
```

全 ADR からタグを収集し、使用数付きで一覧表示します。

### adr validate — ADR バリデーション

```
qtk adr validate [--dir <path>]
```

全 ADR のバリデーションを実行します:
- 必須フィールド (title, status) の存在
- ステータス値の妥当性 (`proposed`/`accepted`/`deprecated`/`superseded`)
- タグ形式 (kebab-case 2-30文字)
- `supersedes` / `superseded_by` の参照整合性 (参照先が存在するか)

エラーがない場合は `全ての ADR は有効です` と出力されます。

---

## spec — 仕様管理

### spec create — 仕様作成

```
qtk spec create <title> [--type <type>] [-d <description>] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<title>` | positional (必須) | 仕様タイトル |
| `--type` | string | 種別 (`specification`/`readme`/`guide`/`other`、デフォルト `specification`) |
| `-d, --description` | string | 説明 |

本文に `## Problem Statement` / `## Solution` / `## User Stories` / `## Implementation Decisions` / `## Testing Decisions` / `## Out of Scope` / `## Further Notes` テンプレートが生成されます。

### spec list — 仕様一覧

```
qtk spec list [--type <type>] [--json] [--dir <path>]
```

### spec show — 仕様詳細

```
qtk spec show <id> [--json] [--dir <path>]
```

### spec update — 仕様の本文更新

```
qtk spec update <id> [--content <body>] [--plain] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<id>` | positional (必須) | 仕様 ID |
| `--content` | string | 本文を一括設定 |
| `--plain` | boolean | マークダウン処理なしでそのまま本文設定 |

---

## plan — 計画管理

### plan create — 計画作成

```
qtk plan create <title> [-d <description>] [--related-issue <id>] [--related-adr <id>] [--generated-by <agent>] [--status <status>] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<title>` | positional (必須) | 計画タイトル |
| `-d, --description` | string | 要約 |
| `--related-issue` | string | 関連 issue ID (※1つのみ) |
| `--related-adr` | string | 関連 ADR ID (※1つのみ) |
| `--generated-by` | string | 生成エージェント名 |
| `--status` | string | plan_status (デフォルト `drafting`) |

本文に `## Context` / `## Goals` / `## Design` / `## Tasks` / `## Risks` / `## References` テンプレートが生成されます。

### plan list — 計画一覧

```
qtk plan list [--status <status>] [--related-issue <id>] [--json] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `--status` | string | plan_status でフィルタ (`drafting`/`ready`/`in-progress`/`completed`/`superseded`/`abandoned`) |
| `--related-issue` | string | 関連 issue でフィルタ |
| `--json` | boolean | JSON 出力 |

### plan show — 計画詳細

```
qtk plan show <id> [--json] [--dir <path>]
```

### plan edit — 計画編集

```
qtk plan edit <id> [--status <status>] [--related-issue <id>] [--related-adr <id>] [--supersedes <old-id>] [--title <title>] [--description <desc>] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<id>` | positional (必須) | 計画 ID |
| `--status` | string | plan_status を更新 |
| `--related-issue` | string | 関連 issue ID を更新 |
| `--related-adr` | string | 関連 ADR ID を更新 |
| `--supersedes` | string | 置き換える旧計画 ID (旧計画の superseded_by と plan_status を自動更新) |
| `--title` | string | タイトルを更新 |
| `--description` | string | 要約を更新 |

### plan archive — 計画アーカイブ

```
qtk plan archive <id> [--dir <path>]
```

---

## tags — 全タグ一覧

```
qtk tags [--json] [--dir <path>]
```

全種別 (issue / adr / spec / plan) からタグを動的収集し、使用数付きで一覧表示します。

---

## search — 横断検索

```
qtk search <keyword> [--type <type>] [--status <status>] [--tag <tag>] [--limit <n>] [--json] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<keyword>` | positional (必須) | 検索キーワード (日本語可) |
| `--type` | string | 種別で絞り込み (`issue`/`adr`/`spec`/`plan`) |
| `--status` | string | ステータスでフィルタ |
| `--tag` | string | タグでフィルタ |
| `--limit` | string | 件数制限 |
| `--json` | boolean | JSON 出力 |

issue / adr / spec / plan 横断の全文検索 (frontmatter + 本文)。テーブル出力: ID / 種別 / タイトル / ステータス

---

## graph — 依存グラフ表示

```
qtk graph [--plan <id>] [--cycles] [--format <text|dot|json>] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `--plan` | string | 計画 ID でフィルタ (plan に紐付く issue のグラフ) |
| `--cycles` | boolean | 循環依存を検出・表示 |
| `--format` | string | 出力形式 (`text` デフォルト / `dot` Graphviz / `json`) |

**text 形式** (デフォルト): 各ノードと依存先をリスト表示
**dot 形式**: Graphviz DOT 形式 (`dot -Tpng graph.dot` で画像化可能)
**json 形式**: グラフ構造 + 循環依存を JSON で出力

---

## web — Web UI / Kanban

```
qtk web [--port <port>] [--no-open] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `--port` | string | ポート番号 (デフォルト 3000) |
| `--no-open` | boolean | ブラウザを自動で開かない |

ローカル Web サーバーを起動 (http://127.0.0.1:port)。Kanban ボード (new / in-progress / paused / done 列、ドラッグ&ドロップ) で issue のステータス変更が可能。issue 作成・編集フォームも利用可能。LAN 非公開 (ローカルのみ)。

> **注意**: 現状、ブラウザ自動オープンは Windows 専用 (`cmd /c start`) です。macOS/Linux では `--no-open` を指定し、手動で URL を開いてください。

---

## migrate-adr — ADR 移行

```
qtk migrate-adr <source-dir> [--dry-run] [--dir <path>]
```

| オプション | 型 | 説明 |
|---|---|---|
| `<source-dir>` | positional (必須) | ソースディレクトリ (例: `docs/adr`) |
| `--dry-run` | boolean | ドライラン (変換のみ確認、ファイル書き込みなし) |

既存の `docs/adr/NNNN-*.md` を qtk 形式に変換します:
- `date` → `created_at` / `updated_at`
- `labels` → `tags`
- supersedes / superseded_by の番号参照を更新