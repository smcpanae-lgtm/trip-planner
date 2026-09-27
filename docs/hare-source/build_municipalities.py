"""
晴れ探しドライブ（/hare）用の市区町村代表点データを作る。

入力: raw/N03-20250101.geojson（国土数値情報 行政区域データ 2025年1月1日時点。README.md 参照）
出力:
  - ../../src/data/hare/municipalities.json … 画面・APIが使う代表点データ
  - components.txt … 陸続きのまとまり（島ごと）の一覧。LAND_LINKS / FERRY_ONLY の見直し用
  - excluded.csv … フェリーなしでは車で行けない（＝本土側から候補にしない）市町村の一覧

必要なもの: Python 3.10+ と shapely（pip install shapely）

処理の流れ:
  1. 政令指定都市の区を市にまとめる（東京23区は独立した市区町村なのでまとめない）。
  2. 所属未定地と北方領土の6村を除く。
  3. 各市区町村の「いちばん大きい陸地」の内側で、境界からもっとも遠い点（polylabel）を代表点にする。
     重心と違って海上や隣の市町村に出ない。
  4. 各市区町村のいちばん大きい陸地どうしが接しているかで、陸続きのまとまりを作る。
  5. 橋・トンネルで結ばれたまとまりを LAND_LINKS で手作業でつなぎ、車で行き来できる「陸域」を決める。
     それ以外のまとまりは FERRY_ONLY に理由とともに列挙する（列挙漏れがあるとエラーで止まる）。
"""

from __future__ import annotations

import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

from shapely.geometry import MultiPolygon, Point, Polygon, shape
from shapely.ops import polylabel, unary_union
from shapely.strtree import STRtree

HERE = Path(__file__).resolve().parent
SRC = HERE / "raw" / "N03-20250101.geojson"
OUT_JSON = HERE.parent.parent / "src" / "data" / "hare" / "municipalities.json"
OUT_COMPONENTS = HERE / "components.txt"
OUT_EXCLUDED = HERE / "excluded.csv"

# 北方領土の6村（色丹村・泊村・留夜別村・留別村・紗那村・蘂取村）
NORTHERN_TERRITORIES = {"01695", "01696", "01697", "01698", "01699", "01700"}

# 隣接判定の許容幅（度）。境界の座標は隣どうしで共有されているが、念のため約50m幅をとる
TOUCH_TOLERANCE_DEG = 0.0005

# 陸続きのまとまりは「そのまとまりに属する代表的な市区町村名（都道府県＋名前）」で指定する。
# 本土4島と沖縄本島を基準の陸域にする（青函トンネルは車で通れないため北海道は本州と別の陸域）。
BASE_LANDS = {
    "honshu": "東京都千代田区",
    "hokkaido": "北海道札幌市",
    "okinawa": "沖縄県那覇市",
}

# 橋・トンネルで本土側とつながる（＝車で行ける）まとまり。キー: まとまり内の市区町村, 値: つながる先の陸域と経路
LAND_LINKS: dict[str, tuple[str, str]] = {
    "福岡県北九州市": ("honshu", "関門トンネル・関門橋で本州と接続（九州）"),
    "愛媛県松山市": ("honshu", "瀬戸大橋・しまなみ海道・明石海峡大橋経由で本州と接続（四国）"),
    "兵庫県洲本市": ("honshu", "明石海峡大橋・大鳴門橋で本州・四国と接続（淡路島）"),
    "熊本県天草市": ("honshu", "天草五橋・天草瀬戸大橋などで九州と接続（天草上島・下島）"),
    "熊本県上天草市": ("honshu", "天草五橋で九州と接続"),
    "広島県江田島市": ("honshu", "早瀬大橋・音戸大橋などで本州と接続（江田島・能美島）"),
    "山口県周防大島町": ("honshu", "大島大橋で本州と接続（屋代島）"),
    "山口県上関町": ("honshu", "上関大橋で本州と接続（長島）"),
    "長崎県平戸市": ("honshu", "平戸大橋で九州と接続（平戸島）"),
    "鹿児島県長島町": ("honshu", "黒之瀬戸大橋で九州と接続（長島）"),
}

# フェリー（または航空機）でしか車で渡れないまとまり。キー: まとまり内の市区町村, 値: 島名
FERRY_ONLY: dict[str, str] = {
    "北海道利尻町": "利尻島",
    "北海道礼文町": "礼文島",
    "北海道奥尻町": "奥尻島",
    "東京都大島町": "伊豆大島",
    "東京都利島村": "利島",
    "東京都新島村": "新島・式根島",
    "東京都神津島村": "神津島",
    "東京都三宅村": "三宅島",
    "東京都御蔵島村": "御蔵島",
    "東京都八丈町": "八丈島",
    "東京都青ヶ島村": "青ヶ島",
    "東京都小笠原村": "小笠原諸島",
    "新潟県佐渡市": "佐渡島",
    "新潟県粟島浦村": "粟島",
    "島根県隠岐の島町": "島後（隠岐）",
    "島根県海士町": "中ノ島（隠岐）",
    "島根県西ノ島町": "西ノ島（隠岐）",
    "島根県知夫村": "知夫里島（隠岐）",
    "広島県大崎上島町": "大崎上島",
    "香川県土庄町": "小豆島",
    "香川県直島町": "直島",
    "愛媛県上島町": "弓削島・生名島・岩城島など（上島諸島）",
    "長崎県対馬市": "対馬",
    "長崎県壱岐市": "壱岐",
    "長崎県五島市": "福江島など（五島列島）",
    "長崎県新上五島町": "中通島など（五島列島）",
    "長崎県小値賀町": "小値賀島",
    "大分県姫島村": "姫島",
    "鹿児島県西之表市": "種子島",
    "鹿児島県屋久島町": "屋久島・口永良部島",
    "鹿児島県三島村": "竹島・硫黄島・黒島（三島村）",
    "鹿児島県十島村": "トカラ列島",
    "鹿児島県奄美市": "奄美大島",
    "鹿児島県喜界町": "喜界島",
    "鹿児島県徳之島町": "徳之島",
    "鹿児島県和泊町": "沖永良部島",
    "鹿児島県与論町": "与論島",
    "沖縄県伊平屋村": "伊平屋島",
    "沖縄県伊是名村": "伊是名島",
    "沖縄県伊江村": "伊江島",
    "沖縄県渡嘉敷村": "渡嘉敷島",
    "沖縄県座間味村": "座間味島など（慶良間諸島）",
    "沖縄県粟国村": "粟国島",
    "沖縄県渡名喜村": "渡名喜島",
    "沖縄県久米島町": "久米島",
    "沖縄県南大東村": "南大東島",
    "沖縄県北大東村": "北大東島",
    "沖縄県宮古島市": "宮古島（伊良部島・池間島・来間島と橋で接続）",
    "沖縄県多良間村": "多良間島",
    "沖縄県石垣市": "石垣島",
    "沖縄県竹富町": "西表島・竹富島など（八重山諸島）",
    "沖縄県与那国町": "与那国島",
}

# 市区町村の中でいちばん大きい陸地が、代表点にふさわしくない場合の指定（経度, 緯度の近くの陸地を使う）
MAIN_LAND_HINTS: dict[str, tuple[float, float]] = {
    # いちばん大きい陸地が関西国際空港島の一部になるため、本土側（町役場付近）を使う
    "大阪府田尻町": (135.297, 34.393),
}


def load_features():
    with SRC.open(encoding="utf-8") as f:
        data = json.load(f)
    return data["features"]


def municipality_key(props) -> tuple[str, str] | None:
    """(都道府県, 名前) を返す。政令市の区は市にまとめる。対象外は None"""
    code = props.get("N03_007")
    # 所属未定地（コード末尾が000）と北方領土の6村は候補にしない
    if not code or code.endswith("000") or code in NORTHERN_TERRITORIES:
        return None
    pref = props["N03_001"]
    city = props.get("N03_004") or ""
    ward = props.get("N03_005") or ""
    if ward and city.endswith("市"):
        # 政令指定都市の区 → 市
        return (pref, city)
    return (pref, city or ward)


def municipality_code(pref_name: tuple[str, str], codes: set[str]) -> str:
    """政令市は区コードの最小値の下1桁を0にしたものが市のコード（例: 14131〜14137 → 14130）"""
    if len(codes) == 1:
        return next(iter(codes))
    return min(codes)[:4] + "0"


def largest_polygon(geom) -> Polygon:
    if isinstance(geom, Polygon):
        return geom
    if isinstance(geom, MultiPolygon):
        return max(geom.geoms, key=lambda g: g.area)
    raise TypeError(type(geom))


def main() -> int:
    print("reading", SRC)
    parts: dict[tuple[str, str], list] = defaultdict(list)
    codes: dict[tuple[str, str], set[str]] = defaultdict(set)
    for feat in load_features():
        key = municipality_key(feat["properties"])
        if key is None or feat["geometry"] is None:
            continue
        parts[key].append(shape(feat["geometry"]))
        codes[key].add(feat["properties"]["N03_007"])
    print("municipalities:", len(parts))

    records = []
    for (pref, name), geoms in parts.items():
        code = municipality_code((pref, name), codes[(pref, name)])
        merged = unary_union(geoms) if len(geoms) > 1 else geoms[0]
        merged = merged.buffer(0)
        hint = MAIN_LAND_HINTS.get(pref + name)
        if hint and isinstance(merged, MultiPolygon):
            main_land = min(merged.geoms, key=lambda g: g.distance(Point(hint)))
        else:
            main_land = largest_polygon(merged)
        simplified = main_land.simplify(0.0005, preserve_topology=True)
        pt = polylabel(simplified, tolerance=0.001)
        if not main_land.contains(pt):
            pt = main_land.representative_point()
        records.append(
            {
                "code": code,
                "pref": pref,
                "name": name,
                "label": pref + name,
                "lat": round(pt.y, 5),
                "lng": round(pt.x, 5),
                "_land": main_land,
            }
        )
    records.sort(key=lambda r: r["code"])

    # 陸続きのまとまり（Union-Find）
    lands = [r["_land"] for r in records]
    tree = STRtree(lands)
    parent = list(range(len(records)))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i, land in enumerate(lands):
        for j in tree.query(land.buffer(TOUCH_TOLERANCE_DEG), predicate="intersects"):
            j = int(j)
            if j != i:
                parent[find(i)] = find(j)

    by_label = {r["label"]: i for i, r in enumerate(records)}
    groups: dict[int, list[int]] = defaultdict(list)
    for i in range(len(records)):
        groups[find(i)].append(i)

    def root_of(label: str) -> int:
        if label not in by_label:
            raise SystemExit(f"unknown municipality in table: {label}")
        return find(by_label[label])

    land_of_root: dict[int, str] = {}
    reason_of_root: dict[int, str] = {}
    for land_id, label in BASE_LANDS.items():
        land_of_root[root_of(label)] = land_id
    for label, (land_id, reason) in LAND_LINKS.items():
        land_of_root[root_of(label)] = land_id
        reason_of_root[root_of(label)] = reason
    ferry_roots: dict[int, str] = {}
    for label, island in FERRY_ONLY.items():
        ferry_roots[root_of(label)] = island

    # 確認用: まとまりの一覧
    lines = []
    unclassified = []
    for root, members in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        labels = [records[i]["label"] for i in members]
        if root in land_of_root:
            status = f"LAND:{land_of_root[root]}"
        elif root in ferry_roots:
            status = f"FERRY:{ferry_roots[root]}"
        else:
            status = "UNCLASSIFIED"
            unclassified.append(labels)
        head = ", ".join(labels[:8]) + (f" ...(+{len(labels) - 8})" if len(labels) > 8 else "")
        lines.append(f"{status}\t{len(labels)}\t{head}")
    OUT_COMPONENTS.write_text("\n".join(lines) + "\n", encoding="utf-8")

    if unclassified:
        print(f"UNCLASSIFIED components: {len(unclassified)} (see {OUT_COMPONENTS.name})")
        for labels in unclassified:
            print("  ", ", ".join(labels))
        return 1

    # 出力
    excluded_rows = []
    out = []
    for i, r in enumerate(records):
        root = find(i)
        if root in land_of_root:
            land = land_of_root[root]
        else:
            island = ferry_roots[root]
            land = "island:" + island
            excluded_rows.append((r["pref"], r["name"], island, "フェリー（または航空機）でしか車で渡れない島"))
        out.append(
            {"code": r["code"], "pref": r["pref"], "name": r["name"], "lat": r["lat"], "lng": r["lng"], "land": land}
        )

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")).replace("},{", "},\n{") + "\n",
        encoding="utf-8",
    )
    with OUT_EXCLUDED.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["都道府県", "市町村", "島", "理由"])
        w.writerows(excluded_rows)

    print("written:", OUT_JSON, len(out), "records,", OUT_JSON.stat().st_size, "bytes")
    print("excluded (ferry-only):", len(excluded_rows))
    return 0


if __name__ == "__main__":
    sys.exit(main())
