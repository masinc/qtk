# qtk CLI 実践ワークフロー集

## ワークフロー 1: 新規プロジェクトのセットアップ

```bash
# 1. ストア初期化
bunx @masinc/qtk init --defaults

# 2. 初期チケット作成
bunx @masinc/qtk issue create "プロジェクト初期設定" -d "package.json, tsconfig.json の設定" --tag setup
# → #0001 が作成される

# 3. アーキテクチャ決定を記録
bunx @masinc/qtk adr new "Use Bun as runtime" -d "Use Bun for TypeScript execution" --tag architecture --status accepted
# → #0002 が作成される

# 4. 計画を作成 (issue #0001 と ADR #0002 を紐付け)
bunx @masinc/qtk plan create "初期リリース計画" -d "MVP リリースまでの計画" --related-issue 1 --related-adr 2 --generated-by claude
# → #0003 が作成される

# 5. 確認
bunx @masinc/qtk issue list
bunx @masinc/qtk adr list
bunx @masinc/qtk plan list
```

## ワークフロー 2: 機能開発のチケット分解

大きな機能を複数チケットに分解し、依存関係を設定する:

```bash
# 1. 親チケット (機能全体) を作成
bunx @masinc/qtk issue create "認証機能を実装" -d "ユーザー認証の全体" --tag feature --ac "ログイン/ログアウトができる"
# → #0010

# 2. 子チケットを作成
bunx @masinc/qtk issue create "DBスキーマ設計" -d "ユーザーテーブル設計" --tag backend --dep 10
# → #0011

bunx @masinc/qtk issue create "API エンドポイント実装" -d "認証API" --tag backend --dep 11
# → #0012

bunx @masinc/qtk issue create "フロントエンド実装" -d "ログイン画面" --tag frontend --dep 12
# → #0013

# 3. 依存グラフで確認
bunx @masinc/qtk graph
# 出力:
# #0010 認証機能を実装 [new]
# #0011 DBスキーマ設計 [new] → #0010
# #0012 APIエンドポイント実装 [new] → #0011
# #0013 フロントエンド実装 [new] → #0012

# 4. 実行可能なチケットを確認
bunx @masinc/qtk issue list --ready
# → 全依存完了のチケットのみ表示
```

> **複数依存の設定**: `--dep` は現状1つしか指定できません。複数依存が必要な場合は、Markdown ファイルを直接編集して `dependencies: [10, 12, 15]` のように配列で設定してください。

## ワークフロー 3: 設計変更 (ADR の置き換え)

既存のアーキテクチャ決定を新しい決定で置き換える:

```bash
# 1. 影響を受ける既存 ADR を検索
bunx @masinc/qtk search "database" --type adr
# → #0005 Use PostgreSQL as Primary DB (accepted)

# 2. 既存タグを確認
bunx @masinc/qtk adr tags
# → database: 3, backend: 5, ...

# 3. 新しい ADR を作成 (旧 ADR #0005 を置き換え)
bunx @masinc/qtk adr new "Use SQLite instead of PostgreSQL" -d "Switch to SQLite for simpler local deployment" --tag database --supersedes 5
# → #0011 が作成される
# → 旧 ADR #0005 の status が自動的に superseded に変更され、superseded_by に 11 が設定される

# 4. 新 ADR の本文を記入 (ファイルを開いて編集)
# .qtk/adrs/0011-*.md の Context / Decision / Consequences を記入

# 5. バリデーション
bunx @masinc/qtk adr validate
# → 参照整合性を確認

# 6. 確認
bunx @masinc/qtk adr list
# #0005 Use PostgreSQL as Primary DB [superseded]
# #0011 Use SQLite instead of PostgreSQL [proposed]
```

## ワークフロー 4: 並行作業 (クレーム)

複数のエージェントセッションが同時に作業する際のクレーム workflow:

```bash
# エージェント A:
bunx @masinc/qtk issue list --ready
# → #0012 APIエンドポイント実装 [new]

bunx @masinc/qtk issue claim 12 --as "@agent-a"
# → クレーム成功。#0012 の status が in-progress に変更

# エージェント B (同時に):
bunx @masinc/qtk issue claim 12 --as "@agent-b"
# → エラー: issue #0012 は @agent-a がクレーム中です (lease: 2026-08-14T...)

# lease 期限切れ後 (デフォルト30分):
bunx @masinc/qtk issue list --stale
# → 期限切れのクレーム一覧

# 再クレーム可能
bunx @masinc/qtk issue claim 12 --as "@agent-b"
# → クレーム成功
```

### 完了時のワークフロー

```bash
# 1. 作業完了を記録
bunx @masinc/qtk issue edit 12 --status done --final-summary "認証APIのエンドポイント3つを実装完了"

# 2. コメントを追記
bunx @masinc/qtk issue edit 12 --comment "テスト全て通過。パフォーマンスも要件内。" --comment-author "@agent-a"

# 3. 依存していたチケットがアンブロックされたか確認
bunx @masinc/qtk issue list --ready
# → #0013 フロントエンド実装 が新たに ready に
```

## ワークフロー 5: 仕様書の作成と計画への統合

```bash
# 1. 仕様書を作成
bunx @masinc/qtk spec create "認証機能仕様書" -d "ユーザー認証の詳細仕様" --type specification
# → #0020

# 2. 仕様の本文を更新
bunx @masinc/qtk spec update 20 --content "## Problem Statement

ユーザーが安全にログイン/ログアウトできる必要がある。

## Solution

JWT ベースのトークン認証を採用する。

## User Stories

- ユーザーとして、メールアドレスとパスワードでログインしたい。
- ユーザーとして、ログアウトしたい。

## Implementation Decisions

- bcrypt でパスワードハッシュ化
- JWT トークン有効期限 24 時間

## Out of Scope

- OAuth (Google/GitHub) は今後のフェーズ
- パスワードリセット機能も別 issue で対応
"

# 3. 計画を作成 (仕様と関連付け)
bunx @masinc/qtk plan create "認証機能実装計画" -d "仕様 #0020 に基づく実装計画" --related-issue 10
# → #0021

# 4. 計画のステータスを進行
bunx @masinc/qtk plan edit 21 --status ready
bunx @masinc/qtk plan edit 21 --status in-progress
# ... 実装 ...
bunx @masinc/qtk plan edit 21 --status completed
```

## ワークフロー 6: トリアージ

新規イシューをトリアージロールで分類する:

```bash
# 1. 新規 (タグなし) イシューを確認
bunx @masinc/qtk issue list
# タグがないものがトリアージ対象

# 2. トリアージラベルを付与
bunx @masinc/qtk issue edit 30 --add-tag needs-triage

# 3. 評価後、ロールに応じたラベルに変更
# エージェントが対応可能な場合:
bunx @masinc/qtk issue edit 30 --add-tag ready-for-agent --comment "エージェントブリーフ: DBスキーマを設計し、マイグレーションを作成する"

# 人間の判断が必要な場合:
bunx @masinc/qtk issue edit 30 --add-tag ready-for-human --comment "設計上の判断が必要: SQLite vs PostgreSQL の選定"

# 追加情報が必要な場合:
bunx @masinc/qtk issue edit 30 --add-tag needs-info --comment "再現手順を教えてください"

# 対象外の場合:
bunx @masinc/qtk issue edit 30 --add-tag wontfix --status done
```

### トリアージバケットの確認

```bash
# タグでフィルタして各バケットを確認
bunx @masinc/qtk issue list --tag needs-triage
bunx @masinc/qtk issue list --tag needs-info
bunx @masinc/qtk issue list --tag ready-for-agent
bunx @masinc/qtk issue list --tag ready-for-human
```

## ワークフロー 7: Web UI でのカンバン管理

```bash
# 1. Web UI 起動
bunx @masinc/qtk web
# → http://127.0.0.1:3000 でブラウザが開く

# 2. Kanban ボードでドラッグ&ドロップ
#    new → in-progress → done のように列間を移動

# 3. issue 作成フォームから新規チケット作成

# 4. 編集フォームでステータス・タグ・コメントを更新
```

> **注意**: 現状、Web UI の API は issues のみ対応しています。ADR/Spec/Plan の操作は CLI から行ってください。

## ワークフロー 8: 横断検索で影響範囲を調査

```bash
# 1. キーワードで全種別を検索
bunx @masinc/qtk search "認証"
# → issue / adr / spec / plan の全てから検索

# 2. ADR のみに絞り込み
bunx @masinc/qtk search "database" --type adr

# 3. タグでフィルタ
bunx @masinc/qtk search "api" --tag backend

# 4. JSON 出力で機械処理
bunx @masinc/qtk search "認証" --json
```

## ワークフロー 9: 循環依存の検出

```bash
# 1. 依存グラフを表示
bunx @masinc/qtk graph

# 2. 循環依存を検出
bunx @masinc/qtk graph --cycles
# 循環依存を検出:
#   #0005 → #0006 → #0005

# 3. 計画に紐付く issue のグラフ
bunx @masinc/qtk graph --plan 3

# 4. Graphviz DOT 形式で出力 (画像化用)
bunx @masinc/qtk graph --format dot > graph.dot
dot -Tpng graph.dot -o graph.png
```