# 世界遺産パスポート 月次ルーチン業務

対象サイト: https://www.ai-drive-planner.com/heritage
実行タイミング: 毎月1日（UNESCO 世界遺産委員会は通常7月に新規登録を決議するため、7〜8月は特に差分が出やすい）

## 目的

ユネスコの登録資産（UNESCO DataHub `whc001`）と、当サイトが保持する資産データの差分を検出し、必要な更新を行う。

サイトの資産一覧そのものは実行時に UNESCO DataHub から直接取得しているため常に最新だが、
以下の「サイト側で持っている付随データ」はユネスコ側の変更に自動追従しないため、月次で突き合わせる。

| サイト側データ | 場所 |
| --- | --- |
| 資産画像マニフェスト | `public/heritage/assets/heritage/manifest.json` |
| 資産画像ファイル | `public/heritage/assets/heritage/*.webp` |
| 日本の資産の日本語名 | `public/heritage/app.js` の `japanHeritageNamesJa` |
| キャッシュ版数 | `public/heritage/app.js` の `SITE_DATA_VERSION` |

## 手順

### 1. 差分チェックを実行

```bash
npm run heritage:check
```

終了コード: `0` = 差分なし / `1` = 要対応の差分あり / `2` = 取得・読み込み失敗

レポートは `scripts/reports/heritage-unesco-YYYY-MM-DD.json` と `latest.json` に保存される
（`latest.json` は次回実行時の「前回比」の基準になるため削除しない。git 管理外）。

### 2. 検出項目と対応

| 検出項目 | 対応 |
| --- | --- |
| ユネスコにあり画像未登録の資産 | 新規登録資産。画像を用意して `assets/heritage/{unescoId}.webp` に配置し、manifest に追記 |
| ユネスコに存在しないマニフェスト項目 | 登録抹消・ID変更の疑い。ユネスコ公式で確認のうえ manifest から削除 |
| マニフェスト参照先の画像が欠落 | 参照切れ。画像を復元するか manifest から該当行を削除 |
| 日本語名テーブル未登録の日本の資産 | `japanHeritageNamesJa` に日本語正式名称を追加 |
| マニフェスト未参照の孤立ファイル | 不要なら削除（容量ポリシー対策） |
| `manifest.stats` のずれ | 実測値（files / mappedImages / totalMb / averageKb）に更新 |
| `SITE_DATA_VERSION` の件数不一致 | `YYYY-MM-{件数}` 形式に更新。これを変えないと利用者のブラウザのキャッシュが更新されない |
| 容量ステータスが `over-target` 以上 | `manifest.policy` の目標（60MB / 警告70MB / 上限80MB、平均48KB）に収まるよう画像を再圧縮 |

参考情報として、危機遺産リストの掲載件数と前回チェックからの増減も出力される。

### 3. 画像の追加基準

- 幅 680px 前後、1枚あたり平均 48KB 以下の webp
- ファイル名は `{unescoId}.webp`（例: `1418.webp`）
- 権利上問題のない画像のみ使用する

### 4. 更新後の確認

1. `npm run heritage:check` を再実行し「差分なし」になること
2. `npm run lint`
3. ブラウザで `/heritage` を開き、カード画像の表示崩れとコンソールエラーがないこと
4. commit / push はユーザーの明示的な指示があった場合のみ

## 自動実行

Claude Code のスケジュールタスク `heritage-unesco-monthly-check`（毎月1日 09:00 ローカル時刻）が
このチェックを実行し、結果を報告する。修正は自動では行わず、報告のみ。

タスク定義: `C:\Users\smcpa\.claude\scheduled-tasks\heritage-unesco-monthly-check\SKILL.md`

> デスクトップアプリの設定がリセットされるとスケジュールタスクは消えるため、
> 消えていた場合はこのドキュメントを元に再登録すること。
