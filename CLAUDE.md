# trip-planner プロジェクト固有の前提

## デプロイ運用（最重要・毎回必ず読むこと）

このプロジェクトは **git をデプロイ元にしていない**。
`npx vercel --prod` で **作業フォルダ（ワーキングディレクトリ）の中身がそのまま本番へ送られる**運用。
GitHub連携による「コミット＝デプロイ」ではない。

### したがって、絶対にやってはいけない誤解

**`git status` の未コミット・未追跡を「本番に未反映」と解釈してはならない。**

git は本番の状態を表していない。git は実態から大きく遅れている。
未コミット・未追跡であっても、すでに本番稼働中であることが普通にある。

### 実例（この事実の裏付け）

以下はすべて **git 未追跡（`??`）なのに本番で稼働中**：

| パス | 本番URL | 状態 |
|---|---|---|
| `src/app/heritage/` | https://www.ai-drive-planner.com/heritage | HTTP 200 稼働中 |
| `src/app/shiori/` | https://www.ai-drive-planner.com/shiori | HTTP 200 稼働中 |
| `src/app/columns/` | https://www.ai-drive-planner.com/columns | HTTP 200 稼働中 |
| `src/data/heritage.ts` / `heritage-sites.json` | 上記の遺産データ | 稼働中 |
| `public/heritage/assets/heritage/*.webp`（約1,173枚） | 各遺産の画像 | 稼働中 |

世界遺産機能の本体一式が未追跡のまま本番で動いている。これがこの運用の何よりの証拠。

### 禁止事項

- `git status` を根拠に「今回の作業と無関係な変更が一緒にデプロイされます」と警告しないこと。
  → 事実として誤り。すでに本番に出ているものが git に記録されていないだけ。
- ユーザーに同じ確認を繰り返させないこと。この件は何度も説明済み。

### 反映状況を確認したい場合の正しい方法

git を見るのではなく、**本番URLに直接アクセスして確認する**。

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://www.ai-drive-planner.com/<path>
```

### デプロイ手順

```bash
npx vercel --prod --yes
```

- 実行前にユーザーの明示的な指示を得ること（グローバル CLAUDE.md の方針どおり）。
- ただし「git が汚れているから」という理由で止めないこと。それは止める理由にならない。

## その他の前提

- 世界遺産の訪問記録は**ブラウザ内保存のみ**。この仕組みは変更しない。
- UNESCO公式の説明文・写真・ロゴは使用しない。
- Vercel無料枠に収まる静的生成を維持する（追加費用ゼロが絶対条件）。
- 世界遺産の多言語対応：日本語は `/heritage`、英語は `/heritage/en`（独立URL・静的生成）。
  他5言語はJavaScript内切替のみ。言語追加時は `src/data/heritage-i18n.ts` /
  `scripts/heritage-build-locales.mjs` / `next.config.ts` / `public/heritage/app.js` の4箇所を更新する。
