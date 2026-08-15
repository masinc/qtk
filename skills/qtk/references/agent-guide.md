# エージェント向けガイドライン

qtk CLI で issue / ADR / spec / plan を作成・操作する際のガイドラインです。一覧・検索・参照のみが必要な場合は、このガイドを参照する必要はありません。

## 新規チケット作成時

1. タイトルを確認する
2. `bunx @masinc/qtk issue create "タイトル" -d "説明" --tag <タグ> --ac "受け入れ基準"` を実行
3. 依存関係がある場合は `--dep <依存先ID>` を指定
4. 作成後、必要に応じて `bunx @masinc/qtk issue edit <ID> --add-tag ready-for-agent` でタグ付与

```bash
# 基本的な作成
bunx @masinc/qtk issue create "認証機能を追加" -d "ユーザー認証を実装" --ac "ログイン画面がある" --tag backend

# 依存関係付き
bunx @masinc/qtk issue create "APIエンドポイント実装" -d "認証APIを実装" --dep 1 --tag backend

# 複数の受け入れ基準は作成後にファイル編集で追加 (現在の CLI 制限により --ac は1つのみ)
```

> **既知の制限**: `--ac`、`--tag`、`--dep` などの配列系オプションは、現状1つしか指定できません (最後の値で上書き)。複数値が必要な場合は、作成後に Markdown ファイルを直接編集するか、`--add-tag` (タグ追加) を使用してください。

## チケットのクレーム (並行作業)

並行セッションで同じチケットを取得する衝突を防ぐため、作業前にクレームします:

```bash
bunx @masinc/qtk issue claim <ID> --as "@agent-name"
```

- 原子的操作 (ファイルロック付き)。既にクレーム済みで lease 有効ならエラー
- lease 期限は `config.yml` の `claimLeaseMinutes` (デフォルト30分)
- lease 期限切れのクレームは `bunx @masinc/qtk issue list --stale` で確認

## 依存関係の管理

```bash
# 依存関係を設定 (チケット #0003 は #0001 と #0002 に依存)
bunx @masinc/qtk issue edit 3 --dep 1
# ※複数依存は配列系オプションの制限により、ファイル直接編集で設定

# 実行可能なチケット (全依存完了) を一覧
bunx @masinc/qtk issue list --ready

# ブロック中のチケット (未完了依存あり) を一覧
bunx @masinc/qtk issue list --blocked

# 依存グラフを表示
bunx @masinc/qtk graph
bunx @masinc/qtk graph --cycles          # 循環依存を検出
bunx @masinc/qtk graph --format dot      # Graphviz DOT 形式
bunx @masinc/qtk graph --plan 5          # 計画 #0005 に紐付く issue のグラフ
```

## 新規 ADR 作成時

1. タイトルを確認する
2. `bunx @masinc/qtk adr new "タイトル" -d "簡潔な要約 (英語推奨 200文字以内)" --tag <タグ>` を実行
3. 生成されたファイルを開き、Context / Decision / Consequences セクションを記入する
4. タグを設定する際は、**必ず事前に `bunx @masinc/qtk adr tags` で既存タグ一覧を確認**し、意味的に重複するタグを避ける
5. 作成後、`bunx @masinc/qtk adr validate` でバリデーションを実行する

```bash
# ADR 作成
bunx @masinc/qtk adr new "Use PostgreSQL as Primary DB" -d "Use PostgreSQL for relational data and JSONB" --tag database --status accepted

# 既存 ADR を置き換える場合 (旧 ADR #0002 を置き換え)
bunx @masinc/qtk adr new "Use SQLite instead" -d "Switch to SQLite for simpler deployment" --supersedes 2
# → 旧 ADR #0002 の status が自動的に superseded に変更され、superseded_by に新 ADR ID が設定される
```

## 設計変更時のワークフロー

1. 影響を受ける既存 ADR を検索: `bunx @masinc/qtk search "キーワード" --type adr`
2. 新しい ADR を作成: `bunx @masinc/qtk adr new "新しい決定" --supersedes <旧ADR ID>`
3. 新 ADR の本文 (Context/Decision/Consequences) を記入
4. `bunx @masinc/qtk adr validate` で参照整合性を確認

## 仕様 (Spec) の作成

```bash
# 仕様作成
bunx @masinc/qtk spec create "認証機能仕様書" -d "ユーザー認証の仕様"

# 本文更新 (--content で本文を一括設定)
bunx @masinc/qtk spec update 1 --content "## Problem Statement\n..."

# 仕様一覧
bunx @masinc/qtk spec list --type specification
```

## 計画 (Plan) の作成

```bash
# 計画作成 (関連 issue / ADR を紐付け)
bunx @masinc/qtk plan create "認証機能の実装計画" -d "認証機能を実装する計画" --related-issue 1 --related-adr 5 --generated-by claude

# 計画のステータス変更
bunx @masinc/qtk plan edit 1 --status ready

# 計画一覧
bunx @masinc/qtk plan list --status in-progress

# 計画詳細
bunx @masinc/qtk plan show 1
```

## 横断検索

```bash
# 全種別を検索
bunx @masinc/qtk search "認証"

# 種別を絞って検索
bunx @masinc/qtk search "database" --type adr

# タグでフィルタ
bunx @masinc/qtk search "auth" --tag backend
```

## Web UI / Kanban

```bash
# Web UI 起動 (デフォルト http://127.0.0.1:3000)
bunx @masinc/qtk web

# ポート指定・ブラウザ自動オープンなし
bunx @masinc/qtk web --port 8080 --no-open
```

Kanban ボード (new / in-progress / paused / done 列) でドラッグ&ドロップ操作が可能。issue の作成・編集・ステータス変更も Web UI から行えます。ローカルのみ (LAN 非公開)。

## トリアージ

新規イシューをトリアージロールで分類する:

```bash
# 1. 新規 (タグなし) イシューを確認
bunx @masinc/qtk issue list

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
bunx @masinc/qtk issue list --tag needs-triage
bunx @masinc/qtk issue list --tag needs-info
bunx @masinc/qtk issue list --tag ready-for-agent
bunx @masinc/qtk issue list --tag ready-for-human
```