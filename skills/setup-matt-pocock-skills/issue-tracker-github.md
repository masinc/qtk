# イシュートラッカー: GitHub

このリポジトリのイシューと仕様は GitHub のイシューとして存在します。すべての操作に `gh` CLI を使用します。

## 規約

- **イシューを作成する**: `gh issue create --title "..." --body "..."`。複数行のボディには heredoc を使用します。
- **イシューを読む**: `gh issue view <number> --comments`。`jq` でコメントをフィルタリングし、ラベルも取得します。
- **イシューを一覧表示する**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` を適切な `--label` と `--state` フィルタとともに使用します。
- **イシューにコメントする**: `gh issue comment <number> --body "..."`
- **ラベルを適用・削除する**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **クローズする**: `gh issue close <number> --comment "..."`

リポジトリは `git remote -v` から推測されます — `gh` はクローン内で実行するとこれを自動的に行います。

## トリアージ面としてのプルリクエスト

**PR をリクエスト面として扱う: いいえ。** _(このリポジトリが外部 PR を機能リクエストとして扱う場合は `yes` に設定します; `/triage` はこのフラグを読みます。)_

`yes` に設定すると、PR はイシューと同じラベルと状態を `gh pr` の同等コマンドで通過します:

- **PR を読む**: 差分は `gh pr view <number> --comments` と `gh pr diff <number>`。
- **トリアージ用に外部 PR を一覧表示する**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` を実行し、`authorAssociation` が `CONTRIBUTOR`、`FIRST_TIME_CONTRIBUTOR`、または `NONE` のものだけを残します (`OWNER`/`MEMBER`/`COLLABORATOR` は除外)。
- **コメント・ラベル・クローズ**: `gh pr comment`、`gh pr edit --add-label`/`--remove-label`、`gh pr close`。

GitHub はイシューと PR で 1 つの番号空間を共有するため、裸の `#42` はどちらか一方の可能性があります — `gh pr view 42` で解決し、見つからなければ `gh issue view 42` にフォールバックします。

## スキルが「イシュートラッカーに公開する」と言ったとき

GitHub のイシューを作成します。

## スキルが「関連チケットを取得する」と言ったとき

`gh issue view <number> --comments` を実行します。

## ウェイファインディング操作

`/wayfinder` が使用します。**マップ**は 1 つのイシューで、**子**イシューがチケットになります。

- **マップ**: `wayfinder:map` ラベルが付いた 1 つのイシューで、Notes / Decisions-so-far / Fog のボディを持ちます。`gh issue create --label wayfinder:map`。
- **子チケット**: マップに GitHub のサブイシューとしてリンクされたイシュー (`gh api` のサブイシューエンドポイントを使用)。サブイシューが有効でない場合は、子をマップボディのタスクリストに追加し、子ボディの先頭に `Part of #<map>` を置きます。ラベル: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`)。一旦クレームされると、チケットはドライブする開発者にアサインされます。
- **ブロッキング**: GitHub の**ネイティブのイシュー依存関係** — 正規の、UI に表示される表現です。`gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>` でエッジを追加します。ここで `<blocker-db-id>` はブロッカーの数値の**データベース ID** です (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`。`#number` や `node_id` ではありません)。GitHub は `issue_dependencies_summary.blocked_by` を報告します (オープンのブロッカーのみ — 生きたゲート)。依存関係が使えない場合は、子ボディの先頭の `Blocked by: #<n>, #<n>` 行にフォールバックします。すべてのブロッカーがクローズされるとチケットはアンブロックされます。
- **フロンティアクエリ**: マップのオープンな子を一覧表示し (`gh issue list --state open` をマップのサブイシュー・タスクリストにスコープ)、オープンなブロッカー (`issue_dependencies_summary.blocked_by > 0`、または `Blocked by` 行にオープンなイシュー) またはアサイニーがあるものを除外します。マップ順で最初のものが勝ちます。
- **クレーム**: `gh issue edit <n> --add-assignee @me` — セッションの最初の書き込みです。
- **解決**: `gh issue comment <n> --body "<answer>"`、次に `gh issue close <n>`、そしてコンテキストポインタ (gist + リンク) をマップの Decisions-so-far に追記します。
