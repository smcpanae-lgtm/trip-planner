# -*- coding: utf-8 -*-
"""built-records.json から src/data/kokudo/nationalRoutes.ts を生成する。"""
import json

with open("built-records.json", encoding="utf-8") as f:
    records = json.load(f)

records.sort(key=lambda r: r["no"])


def esc(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')


lines = []
lines.append("// このファイルは docs/kokudo-source/generate_ts.py により")
lines.append("// docs/kokudo-source/built-records.json から自動生成されています。")
lines.append("// 元データの取得元は docs/kokudo-source/README.md を参照してください。")
lines.append("// 内容を直接編集せず、データを直す場合は生成元スクリプト側を修正してください。")
lines.append("")
lines.append("export interface KokudoRoute {")
lines.append("  /** 路線番号（例: 1 は国道1号） */")
lines.append("  routeNo: number;")
lines.append("  /** 起点（都道府県+市区町村、資料の記載どおり） */")
lines.append("  from: string;")
lines.append("  /** 終点（都道府県+市区町村、資料の記載どおり） */")
lines.append("  to: string;")
lines.append("  /** 通過する都道府県（起点→終点の順、重複なし） */")
lines.append("  prefectures: string[];")
lines.append("  /** 資料に明記された特記事項（海上区間・重用区間など）。ない場合は省略 */")
lines.append("  note?: string;")
lines.append("}")
lines.append("")
lines.append(f"export const KOKUDO_ROUTE_COUNT = {len(records)};")
lines.append("")
lines.append("export const KOKUDO_ROUTES: KokudoRoute[] = [")

for r in records:
    from_s = esc(r["fromPref"] + r["fromCity"])
    to_s = esc(r["toPref"] + r["toCity"])
    prefs = ", ".join(f'"{esc(p)}"' for p in r["throughPrefs"])
    note = r["note"].strip()
    if note:
        note_field = f'note: "{esc(note)}"'
    else:
        note_field = None
    fields = [
        f'routeNo: {r["no"]}',
        f'from: "{from_s}"',
        f'to: "{to_s}"',
        f'prefectures: [{prefs}]',
    ]
    if note_field:
        fields.append(note_field)
    lines.append("  { " + ", ".join(fields) + " },")

lines.append("];")
lines.append("")

out = "\n".join(lines)
with open("nationalRoutes.generated.ts", "w", encoding="utf-8") as f:
    f.write(out)
print("wrote nationalRoutes.generated.ts")
