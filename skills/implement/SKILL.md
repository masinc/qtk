---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

ユーザーが仕様書またはチケットで記述された作業を実装する。

## チケットの取得

qtk CLI の場合、以下のワークフローでチケットを取得・クレーム・完了する:

1. **フロンティアを取得する**: `bunx qtk issue list --ready` — 全依存が完了し、未クレームのチケット一覧
2. **チケット詳細を読む**: `bunx qtk issue show <ID> --json` — チケットの本文・コメント・受け入れ基準を取得
3. **クレームする**: `bunx qtk issue claim <ID> --as "<名前>"` — 原子的クレーム (他セッションと衝突しない)
4. **実装する**: 以下のプロセスに従う
5. **完了する**: `bunx qtk issue edit <ID> --status done` — チケットを完了

本物のイシュートラッカー (GitHub / GitLab) の場合は、トラッカーのネイティブ機能でチケットを取得・クレーム・完了する。ローカル Markdown (`.scratch/`) の場合は、ファイルを直接読み書きする。

## 実装プロセス

可能な場合は、事前に合意したシームで /tdd を使う。

型チェックを定期的に、単一のテストファイルを定期的に、そして最後に完全なテストスイートを一度実行する。

完了したら、/code-review を使って作業をレビューする。

作業を現在のブランチにコミットする。
