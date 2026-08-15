---
name: qtk
description: Manage local issues, ADRs, specs, and plans with the qtk CLI. Use when creating, viewing, searching, or updating issues/ADRs/specs/plans, managing dependencies between tickets, claiming tickets for parallel work, viewing dependency graphs, or running the Kanban Web UI. Covers the full lifecycle from initialization to release.
---

# qtk CLI スキル

## 概要

`qtk` はローカルリポジトリで issue / ADR / spec / plan を一元管理する CLI ツールです。全データは YAML frontmatter 付き Markdown ファイルとして保存され、git でバージョン管理可能です。

- **ストア**: `.qtk/` ディレクトリ (リポジトリルートに配置、隠蔽ディレクトリ)
- **実行**: `bunx @masinc/qtk <command>` (Bun ランタイム必須)
- **ID**: 全種別で共通採番 (`#0001` 形式、デフォルト4桁、プレフィックスなし)
- **種別**: issue / adr / spec / plan の4種別

## クイックリファレンス

```
bunx @masinc/qtk init --defaults                          # ストア初期化
bunx @masinc/qtk issue create "タイトル" -d "説明"        # チケット作成
bunx @masinc/qtk issue list                               # チケット一覧
bunx @masinc/qtk issue list --ready                       # 実行可能なチケット
bunx @masinc/qtk issue show 1 --json                      # チケット詳細 (JSON)
bunx @masinc/qtk issue edit 1 --status in-progress        # ステータス変更
bunx @masinc/qtk issue edit 1 --add-tag backend           # タグ追加
bunx @masinc/qtk issue edit 1 --dep 2                     # 依存関係設定
bunx @masinc/qtk issue claim 1 --as "@agent"              # クレーム (原子的)
bunx @masinc/qtk adr new "タイトル" -d "要約"             # ADR 作成
bunx @masinc/qtk adr list                                 # ADR 一覧
bunx @masinc/qtk adr edit 1 --status accepted             # ADR 承認
bunx @masinc/qtk adr validate                             # ADR バリデーション
bunx @masinc/qtk spec create "タイトル" -d "説明"         # 仕様作成
bunx @masinc/qtk plan create "タイトル" -d "要約"         # 計画作成
bunx @masinc/qtk tags                                     # 全タグ一覧
bunx @masinc/qtk search "キーワード"                      # 横断検索
bunx @masinc/qtk graph --cycles                            # 依存グラフ・循環検出
bunx @masinc/qtk web                                      # Web UI / Kanban
```

## 基本ワークフロー

### 機能開発: チケット作成 → クレーム → 完了

```bash
# 1. 既存タグを確認 (重複を避ける)
bunx @masinc/qtk tags

# 2. チケット作成 (依存関係付き)
bunx @masinc/qtk issue create "APIエンドポイント実装" -d "認証APIを実装" --dep 1 --tag backend

# 3. 実行可能になったらクレーム (並行セッションの衝突を防ぐ)
bunx @masinc/qtk issue claim 2 --as "@agent-a"

# 4. 作業完了
bunx @masinc/qtk issue edit 2 --status done --final-summary "API 3エンドポイント実装完了"
```

### 設計決定の記録: ADR 作成 → 承認 → 置き換え

```bash
# 1. 既存タグを確認 (重複を避ける)
bunx @masinc/qtk adr tags

# 2. ADR 作成
bunx @masinc/qtk adr new "Use PostgreSQL as Primary DB" -d "Use PostgreSQL for relational data" --tag database

# 3. 承認
bunx @masinc/qtk adr edit 1 --status accepted

# 4. 後日、別の決定に置き換える (旧 ADR #0001 の status が自動で superseded に)
bunx @masinc/qtk adr new "Use SQLite instead" -d "Switch to SQLite for simpler deployment" --supersedes 1

# 5. バリデーション
bunx @masinc/qtk adr validate
```

### 計画の作成と進行

```bash
# 1. 計画作成 (issue と ADR を紐付け)
bunx @masinc/qtk plan create "認証機能の実装計画" -d "認証機能を実装する計画" --related-issue 2 --related-adr 1 --generated-by claude

# 2. ドラフト → 実行可能 → 実行中 → 完了
bunx @masinc/qtk plan edit 1 --status ready
bunx @masinc/qtk plan edit 1 --status in-progress
bunx @masinc/qtk plan edit 1 --status completed
```

### 影響範囲の調査

```bash
# キーワードで全種別を横断検索
bunx @masinc/qtk search "認証"
# ADR のみに絞り込み
bunx @masinc/qtk search "database" --type adr
# 依存グラフで循環依存を検出
bunx @masinc/qtk graph --cycles
```

## 注意事項

- タグを新設する前に `bunx @masinc/qtk tags` で既存タグを確認し、同じ概念のタグがあれば新設せず既存タグを再利用すること。詳細は [tag-rules.md](./references/tag-rules.md) を参照。

## 参照

- [setup.md](./references/setup.md) — 初期化・設定ファイル・ストアディレクトリ構成
- [agent-guide.md](./references/agent-guide.md) — 作成・編集・クレーム・設計変更・トリアージのエージェント向けガイドライン
- [command-reference.md](./references/command-reference.md) — 全コマンド・全オプションの完全リファレンス
- [workflows.md](./references/workflows.md) — 実践ワークフロー集 (新規プロジェクト・設計変更・並行作業)
- [data-model.md](./references/data-model.md) — 種別・frontmatter 構造・ID 体系・状態遷移・本文テンプレート
- [tag-rules.md](./references/tag-rules.md) — タグ命名規則・分類・重複防止