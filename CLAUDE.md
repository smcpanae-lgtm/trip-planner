# trip-planner プロジェクト固有の前提

## デプロイ運用（最重要・毎回必ず読むこと）

**2026年8月5日、Vercelプロジェクトの Git 連携（GitHub: `smcpanae-lgtm/trip-planner`）を設定し、
未コミットだった本番稼働中の内容（世界遺産機能・人生体験マップ・AI旅行記メーカー等）を
すべて `master` に同期済み。これ以降このプロジェクトは \*\*git をデプロイ元にしている\*\*。**

- `master` に push すると Vercel が自動でビルド・本番デプロイする（Production Branch = `master`）。
- それ以外のブランチ／PRを push すると Preview デプロイ（本番には影響しない）が作られる。
- `npx vercel --prod` によるCLI直接デプロイは、今後は基本的に使わない
  （使うと git 履歴と本番が再びズレるため）。通常は `git push` だけで完結させる。

### 以前の運用との違い（過去の会話ログを参照する場合の注意）

2026年8月5日より前は、`npx vercel --prod` で作業フォルダの中身を直接本番へ送る運用だったため、
「git が未コミットでも本番はとっくに反映済み」という状態が常態化していた。
**この過去の事情は解消済み。** 今は通常どおり、`git status` の未コミット・未追跡は
「まだ本番に反映されていない」ことを意味する、一般的な git ベースの運用に戻っている。

### 反映状況を確認したい場合

まずは `git log` / `git status` で確認してよい（通常のプロジェクトと同じ）。
より確実に確認したい場合は、本番URLに直接アクセスする。

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://www.ai-drive-planner.com/<path>
```

### デプロイ手順

```bash
git push origin master
```

- 実行前にユーザーの明示的な指示を得ること（グローバル CLAUDE.md の方針どおり）。
- push後はVercelのビルドが走るため、`npx vercel ls trip-planner` 等で `Ready`/`Error` を確認してから完了報告すること。
- 影響範囲が大きい変更（多数の新規ファイルなど）は、いきなり `master` に push せず、
  作業用ブランチを push → Preview デプロイでビルド成功を確認 → `master` にマージ、
  という2段階で行うと安全（2026年8月5日の同期作業ではこの手順を実施した）。

## その他の前提

- 世界遺産の訪問記録は**ブラウザ内保存のみ**。この仕組みは変更しない。
- UNESCO公式の説明文・写真・ロゴは使用しない。
- Vercel無料枠に収まる静的生成を維持する（追加費用ゼロが絶対条件）。
- 世界遺産の多言語対応：日本語は `/heritage`、英語は `/heritage/en`（独立URL・静的生成）。
  他5言語はJavaScript内切替のみ。言語追加時は `src/data/heritage-i18n.ts` /
  `scripts/heritage-build-locales.mjs` / `next.config.ts` / `public/heritage/app.js` の4箇所を更新する。
