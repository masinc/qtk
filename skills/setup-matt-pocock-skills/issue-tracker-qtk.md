# イシュートラッカー: qtk CLI

このリポジトリのイシュー、仕様、計画、ADR は qtk CLI で管理します。データは `qtk/` ディレクトリの Markdown ファイル (YAML frontmatter 付き) として保存されます。

## 初期化

```bash
bunx @masinc/qtk init
```

`qtk/` ディレクトリと `config.yml` が作成されます。`config.yml` で採番桁数・ID プレフィックス・autoCommit などを設定できます。

## 規約

- 全種別 (issue / adr / spec / plan) で共通採番 (`#0001` 形式、デフォルト4桁)
- チケットは `qtk/issues/<NNNN>-<slug>.md`
- ADR は `qtk/adrs/<NNNN>-<slug>.md`
- 仕様は `qtk/specs/<NNNN>-<slug>.md`
- 計画は `qtk/plans/<NNNN>-<slug>.md`
- アーカイブは `qtk/archive/`
- 依存関係は frontmatter の `dependencies` 配列 (構造化依存)
- ステータスは frontmatter の `status` フィールド (issue: `new` / `in-progress` / `paused` / `done`)
- タグは frontmatter の `tags` 配列

## スキルが「イシュートラッカーに公開する」と言ったとき

チケットを作成します:

```bash
bunx @masinc/qtk issue create "タイトル" -d "説明" --tag backend --dep 0002
```

仕様を作成します:

```bash
bunx @masinc/qtk spec create "タイトル" -d "説明"
```

## スキルが「関連チケットを取得する」と言ったとき

```bash
bunx @masinc/qtk issue show 0001 --json
```

## スキルが「実行可能なチケット (フロンティア) を取得する」と言ったとき

```bash
bunx @masinc/qtk issue list --ready
```

全依存が完了し、まだクレームされていないチケットが一覧表示されます。

## スキルが「チケットをクレームする」と言ったとき

```bash
bunx @masinc/qtk issue claim 0001 --as "@agent-name"
```

原子的なクレーム (ファイルロック付き)。他のセッションと衝突しません。

## スキルが「チケットを完了する」と言ったとき

```bash
bunx @masinc/qtk issue edit 0001 --status done
```

## スキルが「コメントを追加する」と言ったとき

```bash
bunx @masinc/qtk issue edit 0001 --comment "コメント本文" 
```

## スキルが「タグを追加・削除する」と言ったとき

```bash
bunx @masinc/qtk issue edit 0001 --add-tag ready-for-agent
bunx @masinc/qtk issue edit 0001 --remove-tag needs-triage
```

## スキルが「依存関係を設定する」と言ったとき

```bash
bunx @masinc/qtk issue edit 0001 --dep 0002
```

`dependencies` 配列に追加されます。`qtk issue list --ready` で全依存完了のチケットを取得できます。

## ウェイファインディング操作

`/wayfinder` が使用します。**マップ**は plan (計画ドキュメント)、**子チケット**は各 issue ファイルです。

- **マップ**: `qtk plan create "計画名"` で計画を作成。plan の本文に Destination / Notes / Decisions-so-far / Not-yet-specified / Out-of-scope セクションを Markdown で書きます。`related_issues` フィールドで子チケットを紐付けます。
- **子チケット**: `qtk issue create "質問のタイトル" --dep <計画に紐付く issue ID>` で依存関係を設定します。チケットタイプ (`research` / `prototype` / `grilling` / `task`) は `tags` で表現します (`--add-tag wayfinder:research` 等)。
- **ブロッキング**: frontmatter の `dependencies` 配列で管理します (`qtk issue edit <ID> --dep <依存先ID>`)。リストされているすべてのチケットが `done` になるとアンブロックされます。
- **フロンティア**: `qtk issue list --ready` で、オープンでアンブロックされ未クレームのチケットを取得します。
- **クレーム**: `qtk issue claim <ID> --as <名前>` で原子的クレームします。
- **解決**: `qtk issue edit <ID> --status done` で完了します。計画全体は `qtk plan edit <ID> --status completed` で完了します。回答は `qtk issue edit <ID> --comment "回答"` で追記します。