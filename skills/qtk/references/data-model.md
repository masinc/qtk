# qtk データモデル・ID 体系・状態遷移

## 種別

| 種別 | 説明 | ステータス | 本文テンプレート |
|---|---|---|---|
| **issue** | ソフトウェアタスク・バグ・機能要望などの作業単位 | `new` → `in-progress` → `paused` / `done` | `## 説明` / `## 受け入れ基準` / `## コメント` |
| **adr** | アーキテクチャ上の決定記録 | `proposed` → `accepted` → `deprecated` / `superseded` | `## Context` / `## Decision` / `## Consequences` |
| **spec** | 機能仕様・README・ガイドなどの文書 (`spec_type`: `specification` / `readme` / `guide` / `other`) | `new` (固定) | `## Problem Statement` / `## Solution` / `## User Stories` / `## Implementation Decisions` / `## Testing Decisions` / `## Out of Scope` / `## Further Notes` |
| **plan** | 計画ドキュメント (`.plans/` の7ファイル構成を1ファイルに統合) | `drafting` → `ready` → `in-progress` → `completed` / `abandoned` / `superseded` | `## Context` / `## Goals` / `## Design` / `## Tasks` / `## Risks` / `## References` |

> **注意**: plan は `status` ではなく `plan_status` を使用します (issue の status と区別)。

## ストアディレクトリ構成

```
<repo-root>/.qtk/
├── config.yaml             # 設定ファイル
├── issues/                  # チケット (NNNN-slug.md)
├── adrs/                    # ADR (NNNN-slug.md)
├── specs/                   # 仕様 (NNNN-slug.md)
├── plans/                   # 計画 (NNNN-slug.md)
├── archive/                 # アーカイブ済み
├── .meta/                   # 内部管理
│   ├── counter.json         # 採番カウンター (バージョン管理対象)
│   ├── counter.lock         # 採番ロックファイル (gitignore 対象)
│   └── claim.lock           # クレームロックファイル (gitignore 対象)
└── .gitignore               # *.lock を除外 (init 時に自動生成)
```

- 全種別で**共通採番** (0001 からの連番)。ファイル名は `<NNNN>-<slug>.md`
- 種別はディレクトリで分離し、かつ frontmatter の `type` フィールドでも管理 (二重管理で検索性と安全性を両立)
- slug はタイトルから生成 (kebab-case、日本語はハッシュ化)

## ID 体系

- **共通採番**: 全種別 (issue / adr / spec / plan) で同一の通し番号
  - 例: #0001 (issue), #0002 (adr), #0003 (spec), #0004 (plan)
- **プレフィックスなし**: `#0001` 形式 (種別はディレクトリと frontmatter の type で判別)
- **デフォルト4桁**: `#0001` 〜 `#9999`。`config.yaml` の `idDigits` で変更可能
- **原子的採番**: ファイルロック (proper-lockfile の mkdir 方式) で並列セッションの採番衝突を防止
- **表示形式**: `#` + ゼロ埋め (例: `#0001`、idDigits=4 の場合)

## frontmatter 構造

### 全種別共通の基本フィールド

```yaml
---
id: 1                          # 数値 ID (共通採番)
type: issue                    # 種別 (issue / adr / spec / plan)
title: "タイトル"
description: "short summary"   # 簡潔な要約
status: "new"                  # ステータス (種別ごとに定義)
tags: []                       # タグ配列 (labels ではなく tags)
assignees: []                  # 担当者配列
created_at: "2026-08-14T..."   # 作成日時 (ISO 8601)
updated_at: "2026-08-14T..."   # 最終更新日時 (ISO 8601)
---
```

> **重要**: `date` フィールドは存在しません。作成日時は `created_at`、更新日時は `updated_at` の対で管理します。タグフィールド名は `tags` であり `labels` は使用しません。

### Issue の追加フィールド

```yaml
dependencies: []               # 依存する issue の ID 配列 (構造化依存)
acceptance_criteria: []        # 受け入れ基準 (チェックリスト)
definition_of_done: []         # DoD (チェックリスト)
plan: ""                       # 実装計画
comments:                      # コメント (追記型)
  - author: "@name"
    created_at: "2026-08-14T..."
    body: "コメント本文"
final_summary: ""              # 完了時サマリー
# Phase 2 (claim / lease):
claimed_by: null               # クレーム者
claimed_at: null                # クレーム日時
lease_expires_at: null          # lease 期限
```

### ADR の追加フィールド

```yaml
deciders: []                   # 決定者一覧
supersedes: null                # この ADR が置き換える ADR の ID
superseded_by: null             # この ADR を置き換えた ADR の ID
# status は adrStatuses (proposed/accepted/deprecated/superseded) を使用
```

### Spec の追加フィールド

```yaml
spec_type: "specification"     # readme / guide / specification / other
parent_issue: null             # 出所の issue ID (あれば)
```

### Plan の追加フィールド

```yaml
plan_status: "drafting"        # plan_status (drafting/ready/in-progress/completed/superseded/abandoned)
                               # ※ status ではなく plan_status を使用
related_issues: []             # 紐付く issue の ID 配列
related_adrs: []               # 紐付く ADR の ID 配列
supersedes: null                # この plan が置き換える plan の ID
superseded_by: null             # この plan を置き換えた plan の ID
generated_at: "2026-08-14T..."  # 生成日時
generated_by: "agent-name"      # 生成エージェント名
# status フィールドは使用しない (plan_status を使用)
# tags は基本 frontmatter に含まれる
```

## 状態遷移

### Issue のステータス

```
new → in-progress → done
                ↘ paused ↗
```

| ステータス | 説明 |
|---|---|
| `new` | 新規作成 (defaultStatus) |
| `in-progress` | 作業中 (claim 時にも自動設定) |
| `paused` | 中断 |
| `done` | 完了 |

### ADR のステータス

```
proposed → accepted → deprecated
                   ↘ superseded
```

| ステータス | 説明 |
|---|---|
| `proposed` | 提案中。まだ承認されていない |
| `accepted` | 承認済み。現在有効な決定 |
| `deprecated` | 非推奨。もはや適用されないが、置き換え先は明示しない |
| `superseded` | 置き換え済み。`superseded_by` で新しい ADR を参照する |

**置き換え関係**:
- ADR A が ADR B を置き換える場合: A の `supersedes` = B の ID、B の `superseded_by` = A の ID、B の `status` = `superseded`
- `qtk adr new --supersedes <B>` または `qtk adr edit <A> --supersedes <B>` で自動的に双方向参照が更新される

### Plan の plan_status

```
drafting → ready → in-progress → completed
                     ↘ abandoned
                     ↘ superseded
```

| plan_status | 説明 |
|---|---|
| `drafting` | ドラフト中 (デフォルト) |
| `ready` | 実行可能 (レビュー完了) |
| `in-progress` | 実行中 |
| `completed` | 完了 |
| `abandoned` | 中止 |
| `superseded` | 別 plan に置き換えられた |

**置き換え関係** (ADR と同様):
- Plan A が Plan B を置き換える場合: A の `supersedes` = B の ID、B の `superseded_by` = A の ID、B の `plan_status` = `superseded`
- `qtk plan edit <A> --supersedes <B>` で自動的に双方向参照が更新される

## 依存関係

### 構造化依存

依存関係は frontmatter の `dependencies` 配列で管理します (テキスト "Blocked by" は使用しません):

```yaml
dependencies: [1, 3, 5]  # issue #0001, #0003, #0005 に依存
```

- **ready** (実行可能): 全ての依存先 issue が `done` の状態
- **blocked** (ブロック中): 依存先に未完了 issue がある状態

```bash
qtk issue list --ready     # 実行可能なチケットのみ
qtk issue list --blocked    # ブロック中のチケットのみ
```

### 循環依存の検出

```bash
qtk graph --cycles
# 循環依存を検出:
#   #0005 → #0006 → #0005
```

Tarjan の SCC (強連結成分) アルゴリズムで循環依存を検出します。

## frontmatter の永続性保証

Backlog.md の「カスタム frontmatter が消失する」問題を解決するため、qtk は以下を保証します:

1. **パース時に全フィールドを保持** — `Bun.YAML.parse` で frontmatter をオブジェクトとしてパース。既知・未知問わず全フィールドを保持
2. **更新時にマージ** — スプレッド構文 (`{ ...record, ...updates }`) で既知フィールドを上書きしつつ未知フィールドを保持
3. **シリアライズ時に全フィールドを出力** — `Bun.YAML.stringify` で保持した全フィールドを YAML に書き戻す

> ユーザーが手動で frontmatter にフィールドを追加しても、CLI での更新時に消失しません。

## 本文 (Markdown body) のテンプレート

### Issue

```markdown
## 説明

<詳細説明>

## 受け入れ基準

- [ ] 基準 1
- [ ] 基準 2

## コメント

<!-- CLI の --comment で追記される -->
```

### ADR

```markdown
## Context

（この決定が必要な背景・技術的制約・ビジネス要件）

## Decision

（採用するアーキテクチャ上の決定とその理由）

## Consequences

（この決定によって生じる影響。ポジティブ・ネガティブ・リスクの両面）
```

### Spec

```markdown
## Problem Statement (問題の記述)
## Solution (解決策)
## User Stories (ユーザーストーリー)
## Implementation Decisions (実装の決定)
## Testing Decisions (テストの決定)
## Out of Scope (対象外)
## Further Notes (その他のメモ)
```

### Plan

```markdown
## Context (背景・現状・制約)
## Goals (目的・ゴール・非ゴール・受け入れ基準)
## Design (設計方針・アーキテクチャ・データモデル)
## Tasks (タスク一覧)
## Risks (リスク・懸念・緩和策)
## References (参考リンク・関連ファイル)
```

Plan の本文は既存の `.plans/<日時>-<slug>/` の 7 ファイル構成 (README, context, goals, design, tasks, risks, references) を 1 ファイルに統合した形式です。各セクションが見出しで区切られます。