# イシュートラッカー: ローカル Markdown

このリポジトリのイシューと仕様は `.scratch/` の Markdown ファイルとして存在します。

## 規約

- 機能ごとに 1 ディレクトリ: `.scratch/<feature-slug>/`
- 仕様は `.scratch/<feature-slug>/spec.md`
- 実装イシューは各チケット 1 ファイルで `.scratch/<feature-slug>/issues/<NN>-<slug>.md` に置き、`01` から番号を付けます — 単一の結合チケットファイルは決して作成しません
- トリアージ状態は各イシューファイルの先頭付近の `Status:` 行に記録します (ロール文字列は `triage-labels.md` を参照)
- コメントと会話履歴は `## Comments` 見出しの下でファイルの末尾に追記します

## スキルが「イシュートラッカーに公開する」と言ったとき

`.scratch/<feature-slug>/` の下に新しいファイルを作成します (必要に応じてディレクトリも作成)。

## スキルが「関連チケットを取得する」と言ったとき

参照されたパスのファイルを読みます。ユーザーは通常、パスまたはイシュー番号を直接渡します。

## ウェイファインディング操作

`/wayfinder` が使用します。**マップ**は 1 つのファイルで、チケットごとに 1 つの**子**ファイルがあります。

- **マップ**: `.scratch/<effort>/map.md` — Notes / Decisions-so-far / Fog のボディです。
- **子チケット**: `.scratch/<effort>/issues/NN-<slug>.md`、`01` から番号を付け、ボディに質問を置きます。`Type:` 行がチケットタイプ (`research`/`prototype`/`grilling`/`task`) を記録し、`Status:` 行が `claimed`/`resolved` を記録します。
- **ブロッキング**: 先頭付近の `Blocked by: NN, NN` 行です。リストされているすべてのファイルが `resolved` になるとチケットはアンブロックされます。
- **フロンティア**: `.scratch/<effort>/issues/` をスキャンして、オープンで、アンブロックされ、未クレームのファイルを探します。番号が最も小さいものが勝ちます。
- **クレーム**: 作業の前に `Status: claimed` を設定して保存します。
- **解決**: `## Answer` 見出しの下に回答を追記し、`Status: resolved` を設定し、`map.md` のマップの Decisions-so-far にコンテキストポインタ (gist + リンク) を追記します。
