# セットアップ

## 初期化

```bash
bunx @masinc/qtk init --defaults
```

`.qtk/` ディレクトリと `config.yaml` が作成されます。サブディレクトリ構成:

```
.qtk/
├── config.yaml          # 設定ファイル
├── issues/              # チケット
├── adrs/                # ADR
├── specs/               # 仕様
├── plans/               # 計画
├── archive/             # アーカイブ
├── .meta/               # 内部管理 (counter.json, *.lock)
└── .gitignore           # *.lock を除外 (init 時に自動生成)
```

## 設定ファイル (config.yaml)

`.qtk/config.yaml` の設定項目:

```yaml
version: "1.0"
idDigits: 4                    # ID の桁数
defaultStatus: "new"           # issue のデフォルトステータス
statuses: [new, in-progress, paused, done]
adrStatuses: [proposed, accepted, deprecated, superseded]
planStatuses: [drafting, ready, in-progress, completed, superseded, abandoned]
claimLeaseMinutes: 30           # claim の lease 期限 (分)
```

| 項目 | デフォルト | 説明 |
|---|---|---|
| `idDigits` | `4` | ID のゼロ埋め桁数 (`#0001` の4桁) |
| `defaultStatus` | `"new"` | issue 作成時のデフォルトステータス |
| `statuses` | `[new, in-progress, paused, done]` | issue のステータス定義 |
| `adrStatuses` | `[proposed, accepted, deprecated, superseded]` | ADR のステータス定義 |
| `planStatuses` | `[drafting, ready, in-progress, completed, superseded, abandoned]` | plan の plan_status 定義 |
| `claimLeaseMinutes` | `30` | claim の lease 期限 (分)。期限切れ後は再クレーム可能 |

## .gitignore の自動生成

`init` 時に `.qtk/.gitignore` が自動生成されます:

```
*.lock
```

`counter.json` はバージョン管理対象 (clone 後も採番が引き継がれる)。`*.lock` (counter.lock, claim.lock) は一時ファイルのため除外。

## ストアディレクトリの探索

`--dir` オプション未指定時、カレントディレクトリから親方向へ `.qtk/config.yaml` を探索します。モノレポ等で `.qtk/` がルートにない場合も自動的に検出されます。

## 前提条件

- [Bun](https://bun.sh/) ランタイムがインストールされていること
- `bunx @masinc/qtk init --defaults` でストアが初期化済みであること