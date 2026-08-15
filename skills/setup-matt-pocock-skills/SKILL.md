---
name: setup-matt-pocock-skills
description: Configure this repo for the engineering skills — set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.
disable-model-invocation: true
---

# Matt Pocock のスキルをセットアップする

エンジニアリングスキル群が前提とするリポジトリ単位の設定を scaffold します:

- **イシュートラッカー** — イシューの置き場所 (デフォルトは GitHub。qtk CLI も標準サポート)
- **トリアージラベル** — 5 つの標準トリアージロールに使う文字列
- **ドメイン文書** — `CONTEXT.md` と ADR の置き場所、およびそれらを読むための利用規約

これは決定論的なスクリプトではなく、プロンプト駆動のスキルです。探索し、見つけたものを提示し、ユーザーに確認してから書き込みます。

## プロセス

### 1. 探索する

現在のリポジトリを調べて開始状態を把握します。既存のものを読み、決めつけないでください:

- `git remote -v` と `.git/config` — GitHub リポジトリか? どれか?
- リポジトリルートの `AGENTS.md` と `CLAUDE.md` — どちらかは存在するか? どちらかに既に `## Agent skills` セクションがあるか?
- リポジトリルートの `CONTEXT.md` と `CONTEXT-MAP.md`
- `docs/adr/` と `src/*/docs/adr/` ディレクトリ
- `docs/agents/` — このスキルの以前の出力が既に存在するか?
- `.scratch/` — ローカル Markdown のイシュートラッカー規約が既に使われている兆候
- `.qtk/` — qtk CLI のイシュートラッカー規約が既に使われている兆候
- `triage` スキルはインストールされているか? (このスキルの隣に `triage` スキルフォルダがあるか、利用可能なスキルに `triage` があるか。) これでセクション B を実行するかどうかが決まります。
- モノレポの兆候 — `pnpm-workspace.yaml`、`package.json` の `workspaces` フィールド、または独自の `src/` を持つ populated な `packages/*`。真に大きなマルチパッケージリポジトリにのみ存在します。これらがないということはシングルコンテキストを意味し、ほとんどのリポジトリがこれに該当します。

### 2. 調査結果を提示して質問する

何が存在し、何が欠けているかを要約します。次にセクションを順番に進めます — 1 セクション、1 回答、そして次へ。

各セクションは推奨回答を先頭に示し、ユーザーが一言で承認できるようにします。選択肢が本当に分岐する場合のみ 1 行の説明を付け、探索で既に決着がついているセクションはスキップします (セクション B は `triage` がインストールされていない場合、セクション C はモノレポがない場合)。

**セクション A — イシュートラッカー。**

> 説明: 「イシュートラッカー」とは、このリポジトリのイシューの置き場所です。`to-tickets`、`triage`、`to-spec` などのスキルはそこを読み書きします — つまり、`gh issue create` を呼ぶのか、`qtk issue create` を呼ぶのか、`.scratch/` の下に Markdown ファイルを書くのか、それともあなたが説明する他のワークフローに従うのかを知る必要があります。このリポジトリで実際に作業を追跡している場所を選んでください。

デフォルトの姿勢: これらのスキルは GitHub 向けに設計されています。`git remote` が GitHub を指している場合は GitHub を提案します。`git remote` が GitLab (`gitlab.com` またはセルフホスト) を指している場合は GitLab を提案します。それ以外の場合 (またはユーザーが希望する場合) は、次を提示します:

- **GitHub** — イシューはリポジトリの GitHub Issues に置く (`gh` CLI を使用)
- **GitLab** — イシューはリポジトリの GitLab Issues に置く ([`glab`](https://gitlab.com/gitlab-org/cli) CLI を使用)
- **qtk CLI** — イシューは `.qtk/` ディレクトリの Markdown ファイルとして qtk CLI で管理する (個人プロジェクトやリモートのないリポジトリに適している。構造化依存・原子的クレーム・共通採番付き)
- **ローカル Markdown** — イシューはこのリポジトリの `.scratch/<feature>/` の下にファイルとして置く (後方互換性のため維持。qtk CLI の使用を推奨)
- **その他** (Jira、Linear など) — ユーザーにワークフローを 1 段落で説明してもらい、スキルは自由形式の散文として記録する

選択内容を `docs/agents/issue-tracker.md` に記録します。GitHub と GitLab のテンプレートには「PR をリクエスト面として扱う」フラグがあり、デフォルトは**オフ**です — オフのままにし、話題にもしないでください。外部 PR をトリアージキューに入れたいユーザーは、後でファイル内のフラグを切り替えられます。

**セクション B — トリアージラベルの語彙。** `triage` スキルがインストールされていない場合は (探索で判明) このセクションを完全にスキップします — インストールされていないスキルにラベルは不要です。

インストールされている場合、質問はちょうど 1 つ:

> デフォルトのトリアージラベルを維持しますか? (推奨: **はい**)

デフォルトは 5 つの標準ロールで、各ラベル文字列は名前と同じです: `needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。**はい**の場合はそのまま書き込みます。ユーザーが「いいえ」と言った場合のみ — 通常はトラッカーが別の名前を既に使っているため (例: `needs-triage` の代わりに `bug:triage`) — 上書きを収集し、`triage` が重複を作らずに既存のラベルを適用するようにします。

**セクション C — ドメイン文書。** デフォルトは**シングルコンテキスト** — リポジトリルートに 1 つの `CONTEXT.md` + `docs/adr/` です。これはほとんどすべてのリポジトリに適合するので、質問せずに書き込みます。

**マルチコンテキスト** — ルートの `CONTEXT-MAP.md` が各コンテキストの `CONTEXT.md` を指す形式 — は、探索でモノレポの兆候が見つかった場合のみ提案します。そのうえでどちらのレイアウトにするか確認します。

### 3. 確認して編集する

ユーザーに次のドラフトを見せます:

- `CLAUDE.md` / `AGENTS.md` のうち編集対象のファイルに追加する `## Agent skills` ブロック (選択ルールはステップ 4 を参照)
- `docs/agents/issue-tracker.md`、`docs/agents/domain.md`、`docs/agents/triage-labels.md` の内容 (最後のものは `triage` がインストールされている場合のみ)

書き込む前に編集させます。

### 4. 書き込む

**編集するファイルを選ぶ:**

- `CLAUDE.md` が存在する場合はそれを編集します。
- そうでなく `AGENTS.md` が存在する場合はそれを編集します。
- どちらも存在しない場合は、どちらを作成するかユーザーに尋ねます — 勝手に選ばないでください。

`CLAUDE.md` が既に存在するときに `AGENTS.md` を作成しないでください (逆も同様) — 常に既に存在する方を編集します。

選択したファイルに `## Agent skills` ブロックが既に存在する場合は、重複を追加せずにその内容をその場で更新します。周辺セクションへのユーザーの編集を上書きしないでください。

ブロック:

```markdown
## Agent skills

### Issue tracker

[イシューの追跡場所の 1 行要約]。`docs/agents/issue-tracker.md` を参照。

### Triage labels

[ラベル語彙の 1 行要約]。`docs/agents/triage-labels.md` を参照。

### Domain docs

[レイアウトの 1 行要約 — 「single-context」または「multi-context」]。`docs/agents/domain.md` を参照。
```

`### Triage labels` サブブロックを含め、`docs/agents/triage-labels.md` を書くのは、`triage` がインストールされていてセクション B が実行された場合のみです。そうでない場合は、両方とも省略します。

次に、このスキルフォルダ内のシードテンプレートを出発点としてドキュメントファイルを書きます:

- [issue-tracker-github.md](./issue-tracker-github.md) — GitHub イシュートラッカー
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — GitLab イシュートラッカー
- [issue-tracker-qtk.md](./issue-tracker-qtk.md) — qtk CLI イシュートラッカー
- [issue-tracker-local.md](./issue-tracker-local.md) — ローカル Markdown イシュートラッカー (後方互換性)
- [triage-labels.md](./triage-labels.md) — ラベルマッピング (`triage` がインストールされている場合のみ)
- [domain.md](./domain.md) — ドメイン文書の利用規約 + レイアウト

「その他」のイシュートラッカーの場合は、ユーザーの説明を使って `docs/agents/issue-tracker.md` をゼロから書きます。

### 5. 完了

ユーザーにセットアップが完了したことと、どのエンジニアリングスキルが今後これらのファイルを読むかを伝えます。後で `docs/agents/*.md` を直接編集できることも伝えます — このスキルを再実行する必要があるのは、イシュートラッカーを切り替えたい場合か、最初からやり直したい場合だけです。
