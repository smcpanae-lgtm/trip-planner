# -*- coding: utf-8 -*-
"""
主資料(fukatsuyasuna)を正としてルートデータを組み立て、
副資料(Wikipedia)と突き合わせ、機械チェックを行い、
確認用CSVと要確認フラグ一覧、TypeScript用データを出力する。
"""
import json
import re
import csv

with open("parsed-primary.json", encoding="utf-8") as f:
    primary = json.load(f)
with open("parsed-wikipedia.json", encoding="utf-8") as f:
    wiki = {r["no"]: r for r in json.load(f)}

# life-map の japanTileMap.ts と同じ47都道府県の正式名称（正規の集合）
PREF_NAMES = [
    "北海道", "青森県", "秋田県", "岩手県", "山形県", "宮城県", "新潟県", "福島県",
    "石川県", "富山県", "群馬県", "栃木県", "茨城県", "島根県", "鳥取県", "兵庫県",
    "京都府", "福井県", "岐阜県", "長野県", "埼玉県", "千葉県", "長崎県", "佐賀県",
    "福岡県", "広島県", "岡山県", "大阪府", "奈良県", "滋賀県", "愛知県", "山梨県",
    "東京都", "熊本県", "大分県", "山口県", "愛媛県", "香川県", "和歌山県", "三重県",
    "静岡県", "神奈川県", "鹿児島県", "宮崎県", "高知県", "徳島県", "沖縄県",
]
PREF_SET = set(PREF_NAMES)
assert len(PREF_NAMES) == 47

# 都道府県の隣接表（陸路・橋・トンネルで国道が実際に通行できる組を含む）。
# 関門海峡(山口-福岡, 国道2号/3号などが通行)、大鳴門橋(兵庫-徳島, 国道28号)、
# 明石海峡大橋(兵庫内、県境ではないので対象外)は既知の道路接続として追加。
# 北海道・沖縄は本土と陸路/橋で繋がっていないため隣接なし（フェリー区間は備考で捕捉）。
ADJACENCY_RAW = {
    "青森県": ["岩手県", "秋田県"],
    "岩手県": ["青森県", "秋田県", "宮城県"],
    "宮城県": ["岩手県", "秋田県", "山形県", "福島県"],
    "秋田県": ["青森県", "岩手県", "宮城県", "山形県"],
    "山形県": ["秋田県", "宮城県", "福島県", "新潟県"],
    "福島県": ["宮城県", "山形県", "新潟県", "群馬県", "栃木県", "茨城県"],
    "茨城県": ["福島県", "栃木県", "埼玉県", "千葉県"],
    "栃木県": ["福島県", "茨城県", "群馬県", "埼玉県"],
    "群馬県": ["福島県", "栃木県", "埼玉県", "新潟県", "長野県"],
    "埼玉県": ["群馬県", "栃木県", "茨城県", "千葉県", "東京都", "山梨県", "長野県"],
    "千葉県": ["茨城県", "埼玉県", "東京都"],
    "東京都": ["埼玉県", "千葉県", "神奈川県", "山梨県"],
    "神奈川県": ["東京都", "山梨県", "静岡県"],
    "新潟県": ["山形県", "福島県", "群馬県", "長野県", "富山県"],
    "富山県": ["新潟県", "長野県", "岐阜県", "石川県"],
    "石川県": ["富山県", "岐阜県", "福井県"],
    "福井県": ["石川県", "岐阜県", "滋賀県", "京都府"],
    "山梨県": ["埼玉県", "東京都", "神奈川県", "静岡県", "長野県"],
    "長野県": ["新潟県", "群馬県", "埼玉県", "山梨県", "静岡県", "愛知県", "岐阜県", "富山県"],
    "岐阜県": ["富山県", "石川県", "福井県", "滋賀県", "愛知県", "長野県", "三重県"],
    "静岡県": ["神奈川県", "山梨県", "長野県", "愛知県"],
    "愛知県": ["長野県", "岐阜県", "三重県", "静岡県"],
    "三重県": ["愛知県", "岐阜県", "滋賀県", "京都府", "奈良県", "和歌山県"],
    "滋賀県": ["福井県", "岐阜県", "三重県", "京都府"],
    "京都府": ["福井県", "滋賀県", "三重県", "奈良県", "大阪府", "兵庫県"],
    "大阪府": ["京都府", "奈良県", "和歌山県", "兵庫県"],
    "兵庫県": ["京都府", "大阪府", "岡山県", "鳥取県", "徳島県"],  # 徳島県: 大鳴門橋(国道28号)
    "奈良県": ["京都府", "大阪府", "三重県", "和歌山県"],
    "和歌山県": ["大阪府", "奈良県", "三重県"],
    "鳥取県": ["兵庫県", "岡山県", "島根県"],
    "岡山県": ["兵庫県", "鳥取県", "島根県", "広島県"],
    "島根県": ["鳥取県", "岡山県", "広島県", "山口県"],
    "広島県": ["岡山県", "島根県", "山口県", "愛媛県"],  # 愛媛県: しまなみ海道(国道317号)
    "山口県": ["島根県", "広島県", "福岡県"],  # 福岡県: 関門橋・関門トンネル(国道2号ほか)
    "徳島県": ["香川県", "愛媛県", "高知県", "兵庫県"],
    "香川県": ["徳島県", "愛媛県", "岡山県"],
    "愛媛県": ["徳島県", "香川県", "高知県", "広島県"],
    "高知県": ["徳島県", "愛媛県"],
    "福岡県": ["佐賀県", "熊本県", "大分県", "山口県"],
    "佐賀県": ["福岡県", "長崎県"],
    "長崎県": ["佐賀県"],
    "熊本県": ["福岡県", "佐賀県", "大分県", "宮崎県", "鹿児島県"],
    "大分県": ["福岡県", "熊本県", "宮崎県"],
    "宮崎県": ["大分県", "熊本県", "鹿児島県"],
    "鹿児島県": ["熊本県", "宮崎県"],
    "北海道": [],
    "沖縄県": [],
}
# 対称化
ADJ = {p: set(v) for p, v in ADJACENCY_RAW.items()}
for a, bs in list(ADJ.items()):
    for b in bs:
        ADJ.setdefault(b, set()).add(a)
for p in PREF_NAMES:
    ADJ.setdefault(p, set())


def strip_note(s):
    return s.strip()


def split_pref_city(lines):
    """起点/終点セルを都道府県名と市区町村名に分割する。
    通常は<br>で分かれた2行だが、資料側の空行欠落により
    「都道府県名+市区町村名」が1行に連結されている場合があるため
    （route 165 で確認）、既知の都道府県名を先頭一致で判定して分割する。
    """
    if not lines:
        return "", ""
    if len(lines) >= 2:
        return lines[0], "".join(lines[1:])
    s = lines[0]
    for name in sorted(PREF_NAMES, key=len, reverse=True):
        if s.startswith(name):
            return name, s[len(name):]
    return s, ""


records = []
flags_summary = []

for rec in primary:
    no = rec["no"]
    from_lines = rec["fromLines"]
    to_lines = rec["toLines"]
    through_raw = rec["throughPrefs"]
    through_raw_source = list(through_raw)  # 資料そのままの表記（括弧含む）を保全
    note = strip_note(rec["noteRaw"])

    from_pref, from_city = split_pref_city(from_lines)
    to_pref, to_city = split_pref_city(to_lines)

    # 主資料「終点」欄の都道府県名が、同じ欄の市区町村名・備考欄・Wikipediaの
    # いずれとも食い違っている（資料側の入力ミスと判断できる）4件のみ、
    # 裏付けが取れた都道府県名に補正する。ユーザーに報告し承認を得た対応。
    # 元の（誤っている）表記は toPrefSource に保持する。
    TO_PREF_CORRECTIONS = {
        8: "京都府",    # 終点セル: 新潟県(誤)→京都市下京区。備考・Wikipediaとも京都府
        14: "千葉県",   # 終点セル: 東京都(誤)→千葉市中央区。Wikipediaは千葉県
        173: "京都府",  # 終点セル: 兵庫県(誤・通過県リストの中間項目)→綾部市。Wikipediaは京都府
        289: "福島県",  # 終点セル: 新潟県(誤)→いわき市。Wikipediaは福島県
    }
    to_pref_source = to_pref
    to_pref_corrected = False
    if no in TO_PREF_CORRECTIONS and to_pref != TO_PREF_CORRECTIONS[no]:
        to_pref = TO_PREF_CORRECTIONS[no]
        to_pref_corrected = True

    reasons = []

    # 資料側の「（都道府県名）」という括弧表記は、陸上区間はないが海上区間で
    # 通過するとみなす、という資料自身の注記（備考欄に明記）に基づく正式な
    # 都道府県名の一表記なので、括弧を外して正規の都道府県名に正規化する。
    # （route 499 のみで確認。他の路線には出現しない。build_and_check.py 実行時に
    # 「不正な都道府県名を含む路線」が空になることで、他に無いことを毎回検証している。）
    normalized_note_flag = False
    through_raw_normalized = []
    for p in through_raw:
        stripped = p.strip("（）()")
        if stripped != p and stripped in PREF_SET:
            normalized_note_flag = True
            through_raw_normalized.append(stripped)
        else:
            through_raw_normalized.append(p)
    if normalized_note_flag:
        reasons.append(
            f"資料の括弧表記（陸上区間なし・海上区間のみ通過）を正規の都道府県名に正規化: {through_raw} -> {through_raw_normalized}"
        )
    through_raw = through_raw_normalized

    # 都道府県名の妥当性
    invalid_prefs = [p for p in through_raw if p not in PREF_SET]
    if invalid_prefs:
        reasons.append(f"不明な都道府県名: {invalid_prefs}")

    # 重複除去（順序維持）。重複があった場合はフラグへ。
    seen = set()
    through_dedup = []
    had_dup = False
    for p in through_raw:
        if p in seen:
            had_dup = True
            continue
        seen.add(p)
        through_dedup.append(p)
    if had_dup:
        reasons.append(f"通過都道府県に重複あり（原文どおり記載後、一意化）: {through_raw}")

    # 隣接チェック（連続する2県が隣接していないと検出）
    non_adjacent_pairs = []
    for i in range(len(through_dedup) - 1):
        a, b = through_dedup[i], through_dedup[i + 1]
        if b not in ADJ.get(a, set()):
            non_adjacent_pairs.append((a, b))
    if non_adjacent_pairs:
        reasons.append(f"隣接していない可能性: {non_adjacent_pairs}")

    # Wikipedia側との突き合わせ（起点・終点の都道府県が一致するか）
    w = wiki.get(no)
    wiki_mismatch = None
    if w is None:
        wiki_mismatch = "Wikipedia側にこの路線番号が見つからない"
    else:
        w_from_pref = w["fromText"][:3] if w["fromText"] else ""
        w_to_pref = w["toText"][:3] if w["toText"] else ""
        # 都・道・府・県の1文字揺れを許容するため先頭2文字一致で判定
        if from_pref[:2] != w_from_pref[:2]:
            wiki_mismatch = f"起点都道府県が資料間で不一致（主資料:{from_pref} / Wikipedia:{w['fromText']}）"
        elif to_pref[:2] != w_to_pref[:2]:
            wiki_mismatch = f"終点都道府県が資料間で不一致（主資料:{to_pref} / Wikipedia:{w['toText']}）"
    if wiki_mismatch:
        reasons.append(wiki_mismatch)

    if to_pref_corrected:
        reasons.append(
            f"主資料「終点」欄の都道府県名の入力ミスと判断し補正: {to_pref_source} -> {to_pref}"
            f"（終点の市区町村名・備考欄・Wikipediaの記載で裏付け。ユーザー承認済み）"
        )

    needs_review = len(reasons) > 0

    records.append({
        "no": no,
        "fromPref": from_pref,
        "fromCity": from_city,
        "toPref": to_pref,
        "toPrefSource": to_pref_source,
        "toCity": to_city,
        "throughPrefsSource": through_raw_source,
        "throughPrefsRaw": through_raw,
        "throughPrefs": through_dedup,
        "note": note,
        "needsReview": needs_review,
        "reviewReasons": reasons,
    })

# ---- 機械チェック集計 ----
nos = [r["no"] for r in records]
print("路線数:", len(records), "(期待値 459)")
print("路線番号ユニーク数:", len(set(nos)))
print("路線番号範囲:", min(nos), "-", max(nos))
dup_nos = [n for n in set(nos) if nos.count(n) > 1]
print("重複路線番号:", dup_nos)

expected_missing = set(range(59, 101)) | {109, 110, 111, 214, 215, 216}
actual_present = set(nos)
actual_missing = set(range(1, 508)) - actual_present
print("欠番一致:", actual_missing == expected_missing)
print("欠番差分（期待と異なる場合のみ表示）:", actual_missing.symmetric_difference(expected_missing))

zero_pref_routes = [r["no"] for r in records if len(r["throughPrefs"]) == 0]
print("通過都道府県0件の路線:", zero_pref_routes)

invalid_pref_routes = [r["no"] for r in records if any(p not in PREF_SET for p in r["throughPrefsRaw"])]
print("不正な都道府県名を含む路線:", invalid_pref_routes)

review_list = [r for r in records if r["needsReview"]]
print("要確認フラグ件数:", len(review_list))

# ---- CSV出力 ----
with open("kokudo-routes-check.csv", "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["路線番号", "起点", "終点", "通過都道府県", "通過数", "要確認", "要確認理由"])
    for r in records:
        w.writerow([
            r["no"],
            f'{r["fromPref"]}{r["fromCity"]}',
            f'{r["toPref"]}{r["toCity"]}',
            "→".join(r["throughPrefs"]),
            len(r["throughPrefs"]),
            "TRUE" if r["needsReview"] else "",
            " / ".join(r["reviewReasons"]),
        ])
print("wrote kokudo-routes-check.csv")

with open("built-records.json", "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=1)
print("wrote built-records.json")

with open("review-list.json", "w", encoding="utf-8") as f:
    json.dump(review_list, f, ensure_ascii=False, indent=1)
print("wrote review-list.json")
