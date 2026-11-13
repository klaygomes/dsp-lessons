import html
import re
import shutil
import subprocess
from pathlib import Path

import course
import glossary

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
    actions = []
    if r["page"]:
        href = html.escape(r["page"])
        title = f'<a href="{href}">{title}</a>'
        draft = " (draft)" if not r["page_ready"] else ""
        actions.append(f'<a class="pill primary" href="{href}" tabindex="-1" aria-hidden="true">Read the lesson{draft}</a>')
    else:
        actions.append('<span class="soon">Lesson in progress</span>')
    if r["video"]:
        draft = " (draft)" if not r["video_ready"] else ""
        actions.append(f'<a class="pill" href="{html.escape(r["video"])}">Watch the video{draft}</a>')
    else:
        actions.append('<span class="soon">Video in progress</span>')
    chapter = f' · Chapter&nbsp;{r["chapter"]}' if r["chapter"] else ""
    return (f'<li><p class="eyebrow">Lesson {r["n"]}{chapter}</p><h2>{title}</h2>'
            f'<p class="bug">{bug(r["bug"])}</p>'
            f'<p class="actions">{"".join(actions)}</p></li>')


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
<link rel="stylesheet" href="_kit/theme.css">
<style>
:root {{ scrollbar-color: var(--rule) var(--paper); }}
.wrap {{ max-width: var(--page-width); }}
header {{ padding-top: calc(var(--space-section) * 1.2); gap: var(--space-element); justify-items: center; text-align: center; }}
h1 {{ font-size: var(--size-display); }}
.deck {{ font-size: var(--size-lead); font-weight: 500; color: var(--eyebrow-color); }}
.question {{ max-width: 34em; margin-inline: auto; text-wrap: pretty; }}
.course {{ list-style: none; margin: var(--space-section) 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); gap: var(--space-element); }}
.course li {{ display: grid; grid-template-rows: auto auto 1fr auto; gap: 10px; padding: var(--space-card); border-radius: var(--radius-card); box-shadow: var(--ring); background: var(--surface-page); transition: box-shadow 160ms var(--ease), background-color 160ms var(--ease); }}
.course li:hover {{ box-shadow: var(--ring-strong); background: var(--surface-panel); }}
.eyebrow {{ font-size: var(--size-eyebrow); font-weight: 600; color: var(--eyebrow-color); font-variant-numeric: tabular-nums; }}
.course h2 {{ font-size: var(--size-card-title); line-height: var(--leading-heading); }}
.course h2 a {{ color: var(--text-strong); text-decoration: none; }}
.course h2 a:hover {{ text-decoration: underline; text-decoration-thickness: 1px; }}
.course .bug {{ color: var(--text-quiet); max-width: none; text-wrap: pretty; }}
header .actions {{ display: flex; justify-content: center; }}
.course .actions {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }}
.pill {{ display: inline-flex; align-items: center; min-height: var(--pill-height-small); padding: 0 16px; border-radius: var(--radius-pill); background: var(--surface-pill); color: var(--text-strong); font-size: var(--size-label); font-weight: 500; text-decoration: none; }}
.pill:hover {{ background: color-mix(in srgb, var(--surface-pill) 70%, var(--rule)); }}
.pill.primary {{ background: var(--fill-primary); color: var(--label-primary); }}
.pill.primary:hover {{ background: color-mix(in srgb, var(--fill-primary) 85%, var(--paper)); }}
.soon {{ color: var(--text-quiet); font-size: var(--size-label); }}
footer {{ border-top: 1px solid var(--rule); display: grid; gap: 4px; }}
</style>
<div class="wrap">
<header>
<h1>The Phone Line</h1>
<p class="deck">A course in discrete-time signal processing</p>
<p class="question">You are building a digital phone line. Every lesson opens on a bug your customers can hear, and ends when you fix it yourself in a lab. Sixteen lessons, in the order of Oppenheim and Schafer's book (1989).</p>
<p class="actions"><a class="pill" href="glossary.html">Glossary of every term</a></p>
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
    glossary.build()


if __name__ == "__main__":
    build()
