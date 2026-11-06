import html
import re
import shutil
import subprocess
from pathlib import Path

import course

ROOT = Path(__file__).resolve().parent.parent
LADDER = Path.home() / ".claude/skills/klay-learning-ladder"


def tracked():
    out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return set(out.splitlines())


def lessons():
    shipped = tracked()
    rows = []
    for r in course.lessons():
        page = f'{r["folder"]}/3-page/3-page.html' if r["folder"] else None
        video = f'{r["folder"]}/4-video/final.mp4' if r["folder"] else None
        rows.append({
            **r,
            "page": page if page in shipped else None,
            "page_ready": "page ready" in r["status"],
            "video": video if video in shipped else None,
            "video_ready": "video ready" in r["status"],
        })
    return rows


def sentence(text):
    text = text[0].upper() + text[1:]
    return text if text[-1] in ".?!" else text + "."


def bug(text):
    return re.sub(r"(\d) (Hz|s|ms)\b", "\\1&nbsp;\\2", html.escape(sentence(text)))


def row(r):
    title = html.escape(r["title"])
    meta = []
    if r["page"]:
        title = f'<a href="{html.escape(r["page"])}">{title}</a>'
        draft = "" if r["page_ready"] else " (draft)"
        meta.append(f'<a href="{html.escape(r["page"])}" tabindex="-1" aria-hidden="true">Read the lesson</a>{draft}')
    else:
        meta.append('<span class="soon">Lesson in progress</span>')
    if r["video"]:
        draft = "" if r["video_ready"] else " (draft)"
        meta.append(f'<a href="{html.escape(r["video"])}">Watch the video</a>{draft}')
    else:
        meta.append('<span class="soon">Video in progress</span>')
    if r["chapter"]:
        meta.append(f'<span class="soon">Chapter&nbsp;{r["chapter"]}</span>')
    return (f'<li><span class="n">{r["n"]}</span><div><h2>{title}</h2>'
            f'<p class="bug">{bug(r["bug"])}</p>'
            f'<p class="meta">{" · ".join(meta)}</p></div></li>')


def build():
    rows = lessons()
    items = "\n".join(row(r) for r in rows)
    page = f"""<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Phone Line</title>
<meta name="description" content="Story-driven lessons in discrete-time signal processing. Build a digital phone line and fix the bugs your callers can hear, one lab at a time.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="lesson.css">
<style>
:root {{ scrollbar-color: var(--rule) var(--paper); }}
header {{ padding-top: 72px; gap: 0; }}
h1 {{ font-size: clamp(48px, 9vw, 84px); line-height: 0.95; letter-spacing: -0.02em; }}
.deck {{ font-family: var(--font-title); font-style: italic; font-size: clamp(22px, 3vw, 28px); line-height: 1.2; color: var(--ink-soft); margin-top: 10px; }}
.question {{ margin-top: 28px; font-size: 20px; line-height: 1.5; max-width: 31em; text-wrap: pretty; }}
.course {{ list-style: none; margin: 56px 0 0; padding: 0; border-bottom: 1px solid var(--rule); }}
.course li {{ display: grid; grid-template-columns: 3.25rem 1fr; gap: 18px; border-top: 1px solid var(--rule); padding: 22px 0 24px; }}
.course .n {{ font-family: var(--font-title); font-size: 44px; line-height: 0.9; color: var(--ink-soft); font-variant-numeric: tabular-nums; text-align: right; }}
.course h2 {{ font-size: 21px; line-height: 1.3; }}
.course h2 a {{ color: var(--ink); text-decoration: none; }}
.course h2 a:hover {{ color: var(--accent-ink); text-decoration: underline; text-decoration-thickness: 1px; }}
.course .bug {{ font-family: var(--font-title); font-style: italic; font-size: 21px; line-height: 1.3; margin-top: 6px; max-width: 34em; text-wrap: pretty; }}
.course .meta {{ margin-top: 10px; font-size: 15px; color: var(--ink-soft); }}
.course li:hover .n {{ color: var(--accent-ink); }}
.soon {{ color: var(--ink-soft); }}
footer {{ border-top: 0; margin-top: 40px; }}
footer a {{ color: inherit; }}
@media (max-width: 520px) {{ header {{ padding-top: 44px; }} .course li {{ grid-template-columns: 2.5rem 1fr; gap: 12px; }} .course .n {{ font-size: 32px; }} .course .bug {{ font-size: 19px; }} }}
</style>
<div class="wrap">
<header>
<h1>The Phone Line</h1>
<p class="deck">A course in discrete-time signal processing</p>
<p class="question">You are building a digital phone line. Every lesson opens on a bug your customers can hear, and ends when you fix it yourself in a lab. Sixteen lessons, in the order of Oppenheim and Schafer's book (1989).</p>
</header>
<ol class="course">
{items}
</ol>
<footer>
<span>More writing on the blog, <a href="https://www.estacouveflor.com/">Esta couve flor</a>.</span>
<span>Based on Alan V. Oppenheim and Ronald W. Schafer, <cite>Discrete-Time Signal Processing</cite>, Prentice Hall, 1989.</span>
<span>Lesson text, figures, pages and videos: CC BY-NC 4.0. Code: MIT. See <a href="NOTICE">NOTICE</a>. Source on <a href="https://github.com/klaygomes/dsp-lessons">GitHub</a>.</span>
</footer>
</div>
</html>
"""
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    shutil.copyfile(LADDER / "assets/lesson.css", ROOT / "lesson.css")
    print(ROOT / "index.html")


if __name__ == "__main__":
    build()
