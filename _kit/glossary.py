import html
import re
from pathlib import Path

import course

ROOT = Path(__file__).resolve().parent.parent
LESSON_TAG = re.compile(r"\s*\(lessons? (\d+)\)")


def entries():
    text = (ROOT / "series.md").read_text(encoding="utf-8")
    block = re.search(r"^## Glossary\n(.*?)(?=^## )", text, re.S | re.M).group(1)
    out = []
    for line in block.splitlines():
        m = re.match(r"- (.+?): (.+)$", line)
        if not m:
            continue
        term, rest = m.group(1).strip(), m.group(2).strip()
        tag = LESSON_TAG.search(rest)
        lesson = int(tag.group(1)) if tag else None
        definition = (rest[: tag.start()] + rest[tag.end():]).strip() if tag else rest
        definition = re.sub(r"\s+;", ";", definition).rstrip(";").strip()
        out.append({"term": term, "lesson": lesson, "definition": definition})
    return sorted(out, key=lambda e: re.sub(r"^the ", "", e["term"].lower()))


def slug(term):
    return "term-" + re.sub(r"[^a-z0-9]+", "-", term.lower()).strip("-")


def sentence(text):
    text = text[0].upper() + text[1:]
    return text if text[-1] in ".?!)" else text + "."


def build():
    lessons = {r["n"]: r for r in course.lessons()}
    groups = {}
    for e in entries():
        letter = re.sub(r"^the ", "", e["term"].lower())[0].upper()
        groups.setdefault(letter, []).append(e)
    sections = []
    for letter, items in groups.items():
        rows = []
        for e in items:
            r = lessons.get(e["lesson"])
            link = ""
            if r and r["folder"]:
                link = (f'<a class="pill" href="{html.escape(r["folder"])}/3-page/3-page.html">'
                        f'Lesson {r["n"]}<span class="sr">: {html.escape(r["title"])}</span></a>')
            rows.append(f'<div class="entry" id="{slug(e["term"])}" data-term="{html.escape(e["term"].lower())}">'
                        f'<dt>{html.escape(e["term"])}</dt><dd><p>{html.escape(sentence(e["definition"]))}</p>{link}</dd></div>')
        sections.append(f'<section class="letter" aria-labelledby="l-{letter}"><h2 id="l-{letter}">{letter}</h2><dl>{"".join(rows)}</dl></section>')
    count = sum(len(v) for v in groups.values())
    page = f"""<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Phone Line Glossary</title>
<meta name="description" content="Every term in The Phone Line course, in plain words, with the lesson that introduces it.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="lesson.css">
<link rel="stylesheet" href="_kit/theme.css">
<style>
:root {{ scrollbar-color: var(--rule) var(--paper); }}
[hidden] {{ display: none !important; }}
.k-runner {{ display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 4px 16px; min-height: var(--header-height); border-bottom: 1px solid var(--rule); font-size: var(--size-label); }}
.k-runner a {{ font-family: var(--font-display); font-weight: var(--display-weight); letter-spacing: var(--display-tracking); font-size: 19px; color: var(--text-strong); text-decoration: none; padding: 8px 10px; margin-left: -10px; border-radius: var(--radius-link); }}
.k-runner a:hover {{ background: var(--surface-panel); }}
.k-runner span {{ font-size: var(--size-eyebrow); font-weight: 600; color: var(--eyebrow-color); }}
header {{ padding-top: 0; }}
.k-runner {{ margin-bottom: calc(var(--space-section) * 0.6); }}
.filter {{ display: grid; gap: 6px; margin-top: var(--space-element); }}
.filter label {{ font-size: var(--size-eyebrow); font-weight: 600; color: var(--text-quiet); }}
.filter input {{ font: inherit; color: var(--text-strong); background: var(--surface-panel); border: 0; box-shadow: var(--ring); border-radius: var(--radius-pill); min-height: var(--pill-height); padding: 0 20px; width: 100%; }}
.filter input:focus-visible {{ outline: 2px solid var(--input); outline-offset: 2px; }}
.letters {{ display: flex; flex-wrap: wrap; gap: 4px; margin-top: var(--space-element); }}
.letters a {{ display: inline-grid; place-items: center; min-width: 34px; min-height: 34px; border-radius: var(--radius-pill); background: var(--surface-pill); color: var(--text-strong); text-decoration: none; font-size: var(--size-label); font-weight: 500; }}
.letters a:hover {{ background: color-mix(in srgb, var(--surface-pill) 70%, var(--rule)); }}
section.letter {{ margin-top: calc(var(--space-section) * 0.6); scroll-margin-top: 16px; }}
section.letter h2 {{ font-size: var(--size-heading); }}
dl {{ margin: 0; display: grid; }}
.entry {{ display: grid; gap: 6px; padding: var(--space-element) 0; border-top: 1px solid var(--rule); scroll-margin-top: 16px; }}
.entry:target {{ background: var(--surface-panel); box-shadow: 0 0 0 12px var(--surface-panel); border-radius: 2px; }}
dt {{ font-family: var(--font-display); font-weight: var(--display-weight); letter-spacing: var(--display-tracking); font-size: var(--size-card-title); line-height: var(--leading-heading); color: var(--text-strong); }}
dd {{ margin: 0; display: grid; gap: 10px; justify-items: start; }}
dd p {{ color: var(--text-quiet); max-width: var(--measure); text-wrap: pretty; }}
.pill {{ display: inline-flex; align-items: center; min-height: 30px; padding: 0 14px; border-radius: var(--radius-pill); background: var(--surface-pill); color: var(--text-strong); font-size: var(--size-meta); font-weight: 500; text-decoration: none; }}
.pill:hover {{ background: color-mix(in srgb, var(--surface-pill) 70%, var(--rule)); }}
.sr {{ position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }}
.none {{ color: var(--text-quiet); }}
</style>
<div class="wrap">
<header>
<nav class="k-runner" aria-label="Course"><a href="index.html">The Phone Line</a><span>{count} terms</span></nav>
<h1>Glossary</h1>
<p class="question">Every term the course defines, in the words the lessons use, with the lesson that first explains it.</p>
<div class="filter"><label for="filter">Find a term</label><input id="filter" type="search" autocomplete="off" placeholder="aliasing, pole, bin..."></div>
<nav class="letters" aria-label="Letters">{"".join(f'<a href="#l-{l}">{l}</a>' for l in groups)}</nav>
<p class="none" id="none" hidden>No term matches that. Try a shorter word.</p>
</header>
{chr(10).join(sections)}
<footer>
<span>Based on Alan V. Oppenheim and Ronald W. Schafer, <cite>Discrete-Time Signal Processing</cite>, Prentice Hall, 1989.</span>
<span>Lesson text, figures, pages and videos: CC BY-NC 4.0. Code: MIT. See <a href="NOTICE">NOTICE</a>.</span>
</footer>
</div>
<script>
const input = document.getElementById('filter');
const entries = [...document.querySelectorAll('.entry')];
const letters = [...document.querySelectorAll('section.letter')];
input.addEventListener('input', () => {{
  const q = input.value.trim().toLowerCase();
  entries.forEach(e => {{ e.hidden = q !== '' && !e.dataset.term.includes(q) && !e.textContent.toLowerCase().includes(q); }});
  letters.forEach(s => {{ s.hidden = [...s.querySelectorAll('.entry')].every(e => e.hidden); }});
  document.getElementById('none').hidden = letters.some(s => !s.hidden);
}});
</script>
</html>
"""
    (ROOT / "glossary.html").write_text(page, encoding="utf-8")
    print(ROOT / "glossary.html")


if __name__ == "__main__":
    build()
