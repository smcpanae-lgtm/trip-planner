# 晴れ探しドライブ（/hare）の市区町村代表点データ

`src/data/hare/municipalities.json` の作り方と出典をまとめる。

## 出典・ライセンス

| 項目 | 内容 |
| --- | --- |
| データ | 国土数値情報「行政区域データ」N03（2025年1月1日時点） |
| 提供 | 国土交通省 |
| 配布ページ | https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html |
| ファイル | https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_GML.zip（約632MB、展開後の GeoJSON は約531MB） |
| 使用許諾条件 | オープンデータ（CC BY 4.0）。出典の明記が必要 |
| 取得日 | 2026-09-27 |

画面（/hare 下部の「出典」）には次の表記を出している。

- 市区町村の代表地点：「国土数値情報（行政区域データ）」（国土交通省）を加工して作成
- 気象データ：Open-Meteo.com（CC BY 4.0）

配布ページには「測量法に基づく国土地理院長承認（複製）R 6JHf 503」の記載がある。表記を変えるときは配布ページの最新の説明を確認すること。

## 元データはリポジトリに入れない

`docs/hare-source/raw/` は `.gitignore` で除外している。リポジトリに入るのは、生成物の `src/data/hare/municipalities.json`（約180KB）と、生成スクリプトと確認用の出力（`components.txt`・`excluded.csv`）だけ。

## 作り直す手順

1. 上のファイルをダウンロードし、`docs/hare-source/raw/` に置いて展開する。
   `raw/N03-20250101.geojson` ができればよい。
2. Python 3.10 以上で shapely を入れる。

   ```bash
   pip install shapely
   ```

3. スクリプトを実行する（数分かかる）。

   ```bash
   python docs/hare-source/build_municipalities.py
   ```

   Windows で文字化けするときは、環境変数 `PYTHONIOENCODING=utf-8` を付けて実行する。
4. 出力を確認する。
   - `src/data/hare/municipalities.json`：1行1市区町村。形式は `{"code","pref","name","lat","lng","land"}`。
   - `docs/hare-source/components.txt`：陸続きのまとまりの一覧。
   - `docs/hare-source/excluded.csv`：本土側からの候補にしない市町村の一覧。

年度を更新するときは、スクリプト冒頭の `SRC` と、この README の出典を合わせて直す。

## データの作り方の要点

- **単位**
  - 政令指定都市は区を市にまとめる。コードは区コードの先頭4桁に 0 を付けたもの（例：札幌市 01100）。
  - 東京23区は独立した市区町村として扱う。
  - 所属未定地（コード末尾 000）と北方領土の6村は除く。
- **代表点**
  - 各市区町村のいちばん大きい陸地の内側で、境界からもっとも遠い点（polylabel）を代表点にする。
  - 重心と違い、海上や隣の市町村に出ることがない。
  - 山間部の点になることがある（MVP では許容）。
  - 大阪府田尻町は、いちばん大きい陸地が関西空港島なので、`MAIN_LAND_HINTS` で本土側を指定している。
- **陸域（land）**
  - 車だけで行き来できる範囲を表す。晴れ探しでは、出発地と同じ陸域の市区町村だけを候補にする。
  - `honshu`：本州・九州・四国と、橋・トンネルでつながる島。`LAND_LINKS` に経路つきで列挙している。
  - `hokkaido`：北海道。青函トンネルは車で通れないため本州とは別。
  - `okinawa`：沖縄本島。
  - `island:<島名>`：フェリーでしか渡れない島（`FERRY_ONLY`）。
    - 出発地がその島にあるときは、島内だけを探す。
    - 本土側からの検索では候補にしない。一覧は `excluded.csv`（63市町村）。
  - どのまとまりにも分類されない島が見つかると、スクリプトはエラーで止まる。
    - 境界データの更新で新しいまとまりが出たときは、`LAND_LINKS` か `FERRY_ONLY` に追記する。

## アプリ側での使い方（参考）

- **天気セル**
  - 市区町村は `WEATHER_CELL_DEG`（既定 0.2°、約20km四方）ごとに、陸域別の「天気セル」にまとめる。
  - 同じセルの市区町村は、メンバー代表点の平均地点の予報を共有する。
- **キャッシュタイル**
  - Open-Meteo へは `WEATHER_TILE_DEG`（1°）タイル内の全セルを1リクエストで取得する。
  - タイルごとにURLが決まるので、Next.js のデータキャッシュ（`next.revalidate`、1時間）を利用者間で共有できる。
- 定数はすべて `src/lib/hare/constants.ts` にある。
