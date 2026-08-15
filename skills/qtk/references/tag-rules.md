# タグ命名規則

## 基本ルール

| ルール | 説明 |
|---|---|
| 形式 | 小文字英数字 + ハイフン (`kebab-case`) |
| 禁止文字 | スペース、アンダースコア、日本語、大文字 |
| 最小/最大長 | 2〜30 文字 |
| 重複禁止 | 同一レコード内で同じタグを複数指定不可 |

### 正しい例

| タグ | 判定 |
|---|---|
| `backend` | OK |
| `database` | OK |
| `ready-for-agent` | OK |
| `wayfinder:research` | OK (コロン区切りは許容、スキル固有のタグ) |
| `ci` | OK (2文字) |

### 間違いの例

| タグ | 判定 | 理由 |
|---|---|---|
| `Backend` | NG | 大文字不可 |
| `data base` | NG | スペース不可 |
| `data_base` | NG | アンダースコア不可 |
| `データベース` | NG | 日本語不可 |
| `x` | NG | 2文字未満 |
| `a` + 31文字以上 | NG | 30文字超過 |

## タグの分類 (任意の規約)

タグは用途に応じて分類すると一貫性が保ちやすくなります:

| カテゴリ | 例 | 説明 |
|---|---|---|
| 技術スタック | `postgresql`, `redis`, `react`, `bun` | 採用技術 |
| 関心領域 | `database`, `frontend`, `auth`, `api` | アーキテクチャ領域 |
| 決定種別 | `performance`, `security`, `cost`, `accessibility` | 決定の動機・性質 |
| チーム | `team-platform`, `team-mobile` | 決定者チーム |
| トリアージロール | `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix` | トリアージ状態 |
| wayfinder | `wayfinder:map`, `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, `wayfinder:task` | wayfinder スキルのチケットタイプ |
| 作業状態 | `enhancement`, `bug`, `task`, `proposal`, `setup`, `release` | issue の性質 |

## 意味的重複の防止

タグを設定する際は、**必ず事前に既存タグ一覧を確認**し、意味的に重複するタグを避けること。

```bash
# 全種別のタグ一覧
bunx @masinc/qtk tags

# ADR のみのタグ一覧
bunx @masinc/qtk adr tags
```

### 避けるべき重複の例

| 避ける | 代わりに使う | 理由 |
|---|---|---|
| `db` と `database` の併用 | どちらか一方に統一 | 同じ概念を指す |
| `postgres` と `postgresql` の併用 | どちらか一方に統一 | 同じ技術を指す |
| `frontend` と `front-end` の併用 | どちらか一方に統一 | 表記揺れ |
| `api` と `rest-api` の併用 | より具体的な方に統一 | 包含関係 |
| `auth` と `authentication` の併用 | どちらか一方に統一 | 同じ概念を指す |
| `ci` と `continuous-integration` の併用 | どちらか一方に統一 | 同じ概念を指す |

既存タグに類似の概念があれば、新規タグを作らず既存タグを再利用すること。

## バリデーション

ADR のタグは `qtk adr validate` で形式チェック (kebab-case 2-30文字) が実行されます。issue / spec / plan のタグは現在バリデーションの対象外ですが、同じ規則に従うことを推奨します。