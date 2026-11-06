import json
import re
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
texts = (here / "vo.txt").read_text().strip().split("\n")
base = json.loads((here / "vo" / "lines.json").read_text())
fixes = {}
for arg in sys.argv[1:]:
    line, folder, k = arg.split(":")
    fixes[int(line)] = (folder, int(k))
cache = {}
out = []
for i, rec in enumerate(base, 1):
    if i in fixes:
        folder, k = fixes[i]
        if folder not in cache:
            cache[folder] = json.loads((here / folder / "lines.json").read_text())
        rec = dict(cache[folder][k - 1], i=i)
    text = re.sub(r"\[surprise-oh\] (\w)", lambda m: "Oh, " + m.group(1).lower(), texts[i - 1])
    text = re.sub(r"\[[^\]]*\]\s*", "", text)
    out.append(dict(rec, text=text))
(here / "lines.final.json").write_text(json.dumps(out, indent=1))
print("lines", len(out), "words", sum(len(r["text"].split()) for r in out))
