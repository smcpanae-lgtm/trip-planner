import re
import json

SRC = "fukatsuyasuna-nh-list-zenkoku.utf8.html"

with open(SRC, encoding="utf-8") as f:
    text = f.read()

tables = re.findall(r"<table.*?</table>", text, re.S)
print("table count:", len(tables))

def clean_cell(html):
    # <br> -> line separator, strip all other tags, unescape a few entities
    html = re.sub(r"<br\s*/?>", "\n", html)
    html = re.sub(r"<[^>]+>", "", html)
    html = html.replace("&amp;", "&").replace("&nbsp;", " ")
    lines = [l.strip() for l in html.split("\n")]
    lines = [l for l in lines if l != ""]
    return lines

records = []
for ti, table in enumerate(tables):
    rows = re.findall(r"<tr>(.*?)</tr>", table, re.S)
    for r in rows:
        tds = re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)
        if len(tds) != 5:
            continue  # header row (th) or malformed
        no_lines = clean_cell(tds[0])
        if not no_lines or not no_lines[0].isdigit():
            continue
        no = int(no_lines[0])
        from_lines = clean_cell(tds[1])
        through_lines = clean_cell(tds[2])
        to_lines = clean_cell(tds[3])
        note_lines = clean_cell(tds[4])
        records.append({
            "no": no,
            "tableIndex": ti,
            "fromLines": from_lines,
            "throughPrefs": through_lines,
            "toLines": to_lines,
            "noteRaw": " ".join(note_lines),
        })

print("records parsed:", len(records))
nos = [r["no"] for r in records]
print("unique:", len(set(nos)), "min/max:", min(nos), max(nos))
dup = [n for n in set(nos) if nos.count(n) > 1]
print("dup:", dup)

with open("parsed-primary.json", "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=1)
print("wrote parsed-primary.json")
