# イシュートラッカー: GitLab

このリポジトリのイシューと仕様は GitLab のイシューとして存在します。すべての操作に [`glab`](https://gitlab.com/gitlab-org/cli) CLI を使用します。

## 規約

- **イシューを作成する**: `glab issue create --title "..." --description "..."`。複数行の説明には heredoc を使用します。エディタを開くには `--description -` を渡します。
- **イシューを読む**: `glab issue view <number> --comments`。機械可読な出力には `-F json` を使用します。
- **イシューを一覧表示する**: `glab issue list -F json` を適切な `--label` フィルタとともに使用します。
- **イシューにコメントする**: `glab issue note <number> --message "..."`。GitLab はコメントを「ノート」と呼びます。
- **ラベルを適用・削除する**: `glab issue update <number> --label "..."` / `--unlabel "..."`。複数のラベルはカンマ区切りにするか、フラグを繰り返します。
- **クローズする**: `glab issue close <number>`。`glab issue close` はクローズコメントを受け付けないため、先に `glab issue note <number> --message "..."` で説明を投稿してからクローズします。
- **マージリクエスト**: GitLab は PR を「マージリクエスト」と呼びます。`glab mr create`、`glab mr view`、`glab mr note` などを使用します — `gh pr ...` と同じ形で、`pr` の代わりに `mr`、`comment`/`--body` の代わりに `note`/`--message` を使います。

リポジトリは `git remote -v` から推測されます — `glab` はクローン内で実行するとこれを自動的に行います。

## トリアージ面としてのマージリクエスト

**MR をリクエスト面として扱う: いいえ。** _(このリポジトリが外部マージリクエストを機能リクエストとして扱う場合は `yes` に設定します; `/triage` はこのフラグを読みます。)_

`yes` に設定すると、MR はイシューと同じラベルと状態を `glab mr` の同等コマンドで通過します:

- **MR を読む**: 差分は `glab mr view <number> --comments` と `glab mr diff <number>`。
- **トリアージ用に外部 MR を一覧表示する**: `glab mr list -F json` を実行し、著者がプロジェクトのメンバー・オーナーでない MR (メンテナの進行中の作業ではなく、コントリビューターの MR) だけを残します。
- **コメント・ラベル・クローズ**: `glab mr note`、`glab mr update --label`/`--unlabel`、`glab mr close`。

GitHub と違い、GitLab はイシューと MR を別々に番号付けするため、メンテナがどちらの面を指しているか分かっていれば `#42` は曖昧ではありません。

## スキルが「イシュートラッカーに公開する」と言ったとき

GitLab のイシューを作成します。

## スキルが「関連チケットを取得する」と言ったとき

`glab issue view <number> --comments` を実行します。

## ウェイファインディング操作

`/wayfinder` が使用します。**マップ**は 1 つのイシューで、**子**イシューがチケットになります。

- **マップ**: `wayfinder:map` ラベルが付いた 1 つのイシューで、Notes / Decisions-so-far / Fog のボディを持ちます。`glab issue create --label wayfinder:map`。(ネイティブのエピックを持つ GitLab ティアでは、エピックがマップを保持できる場合があります; ラベル付きイシューはどこでも機能します。)
- **子チケット**: 説明の先頭に `Part of #<map>` を持ち、ラベル `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`) を持つイシューです。一旦クレームされると、チケットはドライブする開発者にアサインされます。
- **ブロッキング**: GitLab の**ネイティブのブロッキングリンク** — 正規の、UI に表示される表現です。`/blocked_by #<n>` クイックアクションをノートとして投稿して追加します (`glab issue note <child> --message "/blocked_by #<blocker>"`)。ネイティブのブロッキングリンクは Premium/Ultimate 機能です。フリーティア (または利用できない場合) では、説明の先頭の `Blocked by: #<n>, #<n>` 行にフォールバックします。すべてのブロッカーがクローズされるとチケットはアンブロックされます。
- **フロンティアクエリ**: `glab issue list -F json` をマップの子にスコープし、オープンなブロッカー — オープンなイシューへのネイティブな `blocked_by` リンク (`glab api projects/:id/issues/:iid/links`) または `Blocked by` 行のオープンなイシュー — またはアサイニーがあるものを除外します。マップ順で最初のものが勝ちます。
- **クレーム**: `glab issue update <n> --assignee @me` — セッションの最初の書き込みです。
- **解決**: `glab issue note <n> --message "<answer>"`、次に `glab issue close <n>`、そしてコンテキストポインタ (gist + リンク) をマップの Decisions-so-far に追記します。
