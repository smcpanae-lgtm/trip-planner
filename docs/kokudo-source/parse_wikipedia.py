import re
import json

SRC = "wikipedia-nihon-no-ippan-kokudo-ichiran.html"

with open(SRC, encoding="utf-8") as f:
    text = f.read()

m = re.search(r'<table class="wikitable sortable plainlinks"[^>]*>.*?</table>', text, re.S)
table = m.group(0)

# Each data row is a <tr ... data-mw='{"parts":[{"template":{... "params":{...}}}]}'>
row_matches = re.findall(r"<tr[^>]*data-mw='([^']*)'", table)
print("data rows found:", len(row_matches))

import html as htmlmod

records = []
for raw in row_matches:
    data = htmlmod.unescape(raw)
    obj = json.loads(data)
    params = obj["parts"][0]["template"]["params"]
    def p(k):
        return params.get(k, {}).get("wt", "")
    no = int(p("1"))
    from_wikitext = p("3")
    to_wikitext = p("5")
    # strip [[ ]] wiki links, keep display text after | if present
    def strip_links(s):
        def repl(mo):
            inner = mo.group(1)
            return inner.split("|")[-1]
        return re.sub(r"\[\[([^\]]+)\]\]", repl, s)
    records.append({
        "no": no,
        "fromText": strip_links(from_wikitext),
        "toText": strip_links(to_wikitext),
        "totalKm": p("6"),
        "realKm": p("7"),
    })

print("records parsed:", len(records))
nos = [r["no"] for r in records]
print("unique:", len(set(nos)), "min/max:", min(nos), max(nos))

with open("parsed-wikipedia.json", "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=1)
print("wrote parsed-wikipedia.json")
