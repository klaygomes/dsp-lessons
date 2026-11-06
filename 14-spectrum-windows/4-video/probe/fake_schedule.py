import json, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent.parent
lines = [l for l in (here / "vo.txt").read_text().splitlines() if l.strip()]
t, out = 0.6, []
for i, l in enumerate(lines, 1):
    ws = re.sub(r"\[[^\]]*\]\s*", "", l).split()
    words = [{"word": w, "frame": round((t + k * 0.29) * 30)} for k, w in enumerate(ws)]
    out.append({"line": i, "text": l, "start": t, "end": t + len(ws) * 0.29, "start_frame": round(t * 30), "words": words})
    t += len(ws) * 0.29 + 0.8
src = (here / "film/index.src.html").read_text()
(here / "film/index.html").write_text(src.replace("/*SCHEDULE*/null", json.dumps({"fps": 30, "duration": round(t + 0.4, 2), "lines": out})))
print("fake duration", t)
