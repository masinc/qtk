---
id: 4
type: adr
title: 種別別サブコマンド設計 (qtk issue/adr/spec/plan)
description: 種別ごとにサブコマンドグループを分け専用オプションを表現する
status: accepted
tags: 
  - cli-design
assignees: 
  []
created_at: 2026-08-14T19:03:06.263Z
updated_at: 2026-08-14T19:03:06.263Z
deciders: 
  []
supersedes: null
superseded_by: null
---

## Context

CLI のコマンド構成をどう設計するかが問題だった。issue と ADR はそれぞれ異なる専用オプションを持つ (issue の `--dep`、ADR の `--supersedes` 等)。また ADR 作成時には Context/Decision/Consequences テンプレートを生成する必要があり、種別ごとの振る舞いを表現できなければならない。

## Decision

**種別別サブコマンド** (`qtk issue ...` / `qtk adr ...` / `qtk spec ...` / `qtk plan ...`) を採用する。

CLI フレームワークには `citty` (unjs) を使用し、`defineCommand` / `runMain` / サブコマンドネストで実装する。

却下した代替案:
- **動詞ファースト (`qtk list --type issue`)** — 種別が分かりにくい。種別ごとの専用オプション (issue の --dep、ADR の --supersedes 等) を表現しにくい
- **種別なし統一コマンド (`qtk new "タイトル"`)** — ADR 作成時に Context/Decision/Consequences テンプレートを分けられない。種別ごとの振る舞いが表現できない
- **`task` サブコマンド使用** — qtk は issue と ADR の両方を管理するため `task` に限定したくない。語感も冗長

## Consequences

**ポジティブ**:
- 種別ごとの専用オプションが自然に表現できる (`qtk issue create --dep`、`qtk adr new --supersedes`)
- 種別ごとのテンプレート生成が自然 (ADR の Context/Decision/Consequences 等)
- ヘルプが種別ごとに分かれ、ユーザーが探しやすい
- `citty` のサブコマンドネストで自動ヘルプ生成

**ネガティブ**:
- コマンドが長くなる (`qtk issue create "タイトル"`)
- 新種別追加時にコマンド実装が必要 (ただし共通採番・種別別設計により拡張は容易)
