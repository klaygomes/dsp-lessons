import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def lessons():
    rows = []
    for line in (ROOT / "series.md").read_text(encoding="utf-8").splitlines():
        m = re.match(r"\| (\d+) \| ([^|]+) \| ([^|]+) \|", line)
        if not m:
            continue
        n = int(m.group(1))
        title = m.group(2).strip()
        ch = re.search(r"\s*\(ch\. (\d+)\)$", title)
        folder = next(iter(sorted(ROOT.glob(f"{n:02d}-*/"))), None)
        rows.append({
            "n": n,
            "title": title[: ch.start()] if ch else title,
            "chapter": ch.group(1) if ch else None,
            "bug": m.group(3).strip(),
            "folder": folder.name if folder else None,
            "status": line.rstrip(" |").rsplit("|", 1)[-1],
        })
    return rows
