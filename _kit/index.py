import html
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LADDER = Path.home() / ".claude/skills/klay-learning-ladder"


def tracked():
    out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return set(out.splitlines())


def lessons():
    shipped = tracked()
    rows = []
    for line in (ROOT / "series.md").read_text(encoding="utf-8").splitlines():
        m = re.match(r"\| (\d+) \| ([^|]+) \| ([^|]+) \|", line)
        if not m:
            continue
        n = int(m.group(1))
        folder = next(iter(sorted(ROOT.glob(f"{n:02d}-*/"))), None)
        page = folder / "3-page/3-page.html" if folder else None
        video = folder / "4-video/final.mp4" if folder else None
        status = line.rstrip(" |").rsplit("|", 1)[-1]
        rows.append({
            "n": n,
            "title": m.group(2).strip(),
            "bug": m.group(3).strip(),
            "page": page.relative_to(ROOT).as_posix() if page and page.relative_to(ROOT).as_posix() in shipped else None,
            "page_ready": "page ready" in status,
            "video": video.relative_to(ROOT).as_posix() if video and video.relative_to(ROOT).as_posix() in shipped else None,
            "video_ready": "video ready" in status,
        })
    return rows


def link(href, label, ready):
    if not href:
        return '<span class="soon">in progress</span>'
    draft = "" if ready else ' <span class="soon">(draft)</span>'
    return f'<a href="{html.escape(href)}">{label}</a>{draft}'


def build():
    items = "\n".join(
        f'<li><span class="n">{r["n"]}</span><div><h2>{html.escape(r["title"])}</h2>'
        f'<p>{html.escape(r["bug"])}</p><p class="links">{link(r["page"], "Open the lesson", r["page_ready"])} · {link(r["video"], "Watch the video", r["video_ready"])}</p></div></li>'
        for r in lessons()
    )
    page = f"""<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Phone Line</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="lesson.css">
<style>
.course {{ list-style: none; padding: 0; display: grid; gap: 18px; }}
.course li {{ display: grid; grid-template-columns: 3rem 1fr; gap: 12px; border-top: 1px solid var(--rule); padding-top: 14px; }}
.course .n {{ font-family: var(--font-mono, monospace); font-size: 1.4rem; color: var(--ink-soft); }}
.course h2 {{ margin: 0 0 4px; font-size: 1.15rem; }}
.course p {{ margin: 0 0 4px; }}
.soon {{ color: var(--ink-soft); }}
</style>
<div class="wrap">
<header>
<p class="topic">Discrete-Time Signal Processing</p>
<h1>The Phone Line</h1>
<p class="question">You are building a digital phone line. Every lesson opens on a bug your customers can hear, and ends when you fix it yourself in a lab. Sixteen lessons, in the order of Oppenheim and Schafer's book (1989).</p>
</header>
<ol class="course">
{items}
</ol>
<footer><span>Lesson text, figures, pages and videos: CC BY-NC 4.0. Code: MIT. See NOTICE.</span></footer>
</div>
</html>
"""
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    shutil.copyfile(LADDER / "assets/lesson.css", ROOT / "lesson.css")
    print(ROOT / "index.html")


if __name__ == "__main__":
    build()
