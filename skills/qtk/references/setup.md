# セットアップ

## 初期化

```bash
bunx @masinc/qtk init --defaults
```

`qtk/` ディレクトリと `config.yml` が作成されます。サブディレクトリ構成:

```
qtk/
├── config.yml          # 設定ファイル
├── issues/             # チケット
├── adrs/               # ADR
├── specs/              # 仕様
├── plans/              # 計画
├── archive/            # アーカイブ
└── .qtk/               # 内部管理 (counter.json, counter.lock)
```

> `.qtk/` は git 管理外を推奨 (`.gitignore` に追加)。

## 設定ファイル (config.yml)

`qtk/config.yml` の設定項目:

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

## ストアディレクトリの探索

`--dir` オプション未指定時、カレントディレクトリから親方向へ `qtk/config.yml` を探索します。モノレポ等で `qtk/` がルートにない場合も自動的に検出されます。

## 前提条件

- [Bun](https://bun.sh/) ランタイムがインストールされていること
- `bunx @masinc/qtk init --defaults` でストアが初期化済みであること