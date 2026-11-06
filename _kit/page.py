#!/usr/bin/env python3
"""Build <lesson>/3-page/3-page.html from 1-prose.md, 2-figures/ and 3-page/shell.html."""
import argparse
import base64
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path

import course

KIT = Path(__file__).resolve().parent
LADDER = Path(os.environ.get("LADDER_SKILL", Path.home() / ".claude/skills/klay-learning-ladder"))
EM_DASH = chr(0x2014)


def svg_of(path):
    return re.search(r'<svg class="k-fig.*?</svg>', path.read_text(encoding="utf-8"), re.S).group(0)


def figure(fig_dir, name, meta):
    page = (fig_dir / f"{name}.html").read_text(encoding="utf-8")
    style = re.search(rf'<style id="fig-{re.escape(name)}-style">.*?</style>', page, re.S).group(0)
    svgs = svg_of(fig_dir / f"{name}.html")
    if meta.get("phone") and (fig_dir / f"{name}.phone.html").exists():
        svgs += svg_of(fig_dir / f"{name}.phone.html")
    kind = "animated" if meta.get("animated") else "still"
    return (f'<figure class="k-figure" id="figure-{name}" data-kind="{kind}">{style}'
            f'<div class="diagram">{svgs}</div><figcaption>{meta["caption"]}</figcaption></figure>')


def section_bounds(body, sid):
    start = body.index(f'<section id="{sid}">')
    return start, body.index("</section>", start)


def append_blocks(body, here, append):
    for sid, name in (append or {}).items():
        _, end = section_bounds(body, sid)
        body = body[:end] + (here / f"{name}.html").read_text(encoding="utf-8") + "\n" + body[end:]
    return body


def block_range(body, sid, first, last):
    start, end = section_bounds(body, sid)
    a = body.index(first, start, end)
    a = body.rindex("\n", start, a) + 1
    b = body.index(last, a, end)
    if body.rfind("<figure", a, b) > body.rfind("</figure>", a, b):
        b = body.index("</figure>", b) + len("</figure>")
    return a, body.index("\n", b)


def wrap_more(body, more):
    for m in more or []:
        a, b = block_range(body, m["section"], m["from"], m["through"])
        label = html.escape(m.get("button", "Show more"))
        box = (f'<details class="k-more"><summary>{label}</summary>'
               f'<div class="k-more-body">\n{body[a:b]}\n</div></details>')
        body = body[:a] + box + body[b:]
    return body


def wrap_working(body, working):
    for w in working or []:
        a, b = block_range(body, w["section"], w["from"], w["through"])
        note = w.get("note", "This part works out the answer to the lab's questions. It opens once you have solved them.")
        label = html.escape(w.get("button", "Show the working (opens after the lab)"))
        opened = f' data-opened="{html.escape(w["opened"], quote=True)}"' if w.get("opened") else ''
        button = "" if w.get("auto") else f'<button type="button" class="k-working-open" disabled>{label}</button>'
        box = (f'<div class="k-working" data-unlock="{w["unlock"]}"{' data-open="auto"' if w.get("auto") else ''}{opened}>'
               f'<p class="k-working-note">{note}</p>'
               f'{button}'
               f'<div class="k-working-body" tabindex="-1" hidden>\n{body[a:b]}\n</div></div>')
        body = body[:a] + box + body[b:]
    return body


def slots_for(lesson, prose):
    fig_dir = lesson / "2-figures"
    index = json.loads((fig_dir / "index.json").read_text(encoding="utf-8")) if (fig_dir / "index.json").exists() else {}
    names = re.findall(r"^\[\[([\w:-]+)\]\]\s*$", prose, re.M)
    slots, missing = {}, []
    for name in names:
        if name.startswith("diagram:"):
            key = name.split(":", 1)[1]
            if key in index and (fig_dir / f"{key}.html").exists():
                slots[name] = figure(fig_dir, key, index[key])
            else:
                missing.append(name)
        else:
            path = lesson / "3-page" / f"{name}.html"
            if path.exists():
                slots[name] = path.read_text(encoding="utf-8")
            else:
                missing.append(name)
    return slots, missing


def fill(shell, here, body):
    def directive(m):
        kind, arg = m.group(1), m.group(2)
        if kind == "BODY":
            return body
        if kind == "KIT":
            return (KIT / arg).read_text(encoding="utf-8")
        if kind == "FILE":
            return (here / arg).read_text(encoding="utf-8")
        if kind == "BASE64":
            return base64.b64encode((here / arg).read_bytes()).decode()
        return m.group(0)
    return re.sub(r"<!--(BODY|KIT|FILE|BASE64)(?::([\w./-]+))?-->", directive, shell)


def check(html):
    problems = []
    if EM_DASH in html:
        problems.append(f"{html.count(EM_DASH)} em dash(es)")
    if re.search(r"\[\[[\w:-]+\]\]", html):
        problems.append("unfilled [[slot]]")
    if re.search(r"<!--(BODY|KIT|FILE|BASE64)", html):
        problems.append("unfilled shell directive")
    ids = Counter(re.findall(r'\sid="([^"]+)"', re.sub(r"<script\b.*?</script>", "", html, flags=re.S)))
    dupes = [i for i, n in ids.items() if n > 1]
    if dupes:
        problems.append(f"duplicate ids: {', '.join(dupes[:8])}")
    for i, script in enumerate(re.findall(r"<script>(.*?)</script>", html, re.S)):
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f:
            f.write(script)
        r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
        os.unlink(f.name)
        if r.returncode:
            problems.append(f"script {i + 1} does not parse: {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else ''}")
    return problems


def motion_text(body, still):
    for moving, resting in (still or {}).items():
        if moving not in body:
            raise SystemExit(f"still_text phrase not found: {moving[:60]}")
        body = body.replace(moving, f'<span class="k-motion-text">{moving}</span><span class="k-still-text">{resting}</span>', 1)
    return body


def keep_punctuation(html):
    parts = re.split(r"(<script\b.*?</script>|<style\b.*?</style>)", html, flags=re.S)
    tie = lambda part: re.sub(r"(<math>(?:(?!</math>).)*</math>)([,.:;!?)])", r'<span class="k-nowrap">\1\2</span>', part, flags=re.S)
    return "".join(part if i % 2 else tie(part) for i, part in enumerate(parts))


def chrome(page, lesson):
    rows = course.lessons()
    me = next((r for r in rows if r["folder"] == lesson.name), None)
    if not me:
        return page
    up = "../../"
    chapter = f" · Chapter {me['chapter']}" if me["chapter"] else ""
    runner = (f'<nav class="k-runner" aria-label="Course"><a href="{up}index.html">The Phone Line</a>'
              f'<span>Lesson {me["n"]} of {len(rows)}{chapter}</span></nav>')
    page = re.sub(r'<p class="topic">.*?</p>', lambda _: runner, page, count=1, flags=re.S)
    teaser = None
    m = re.search(r'\s*<span>Next lesson: (.*?)</span>', page, re.S)
    if m:
        text = re.sub(r"<[^>]+>", "", m.group(1)).strip()
        where = re.search(r", where (.+)$", text, re.S)
        teaser = where.group(1)[0].upper() + where.group(1)[1:] if where else None
        page = page[: m.start()] + page[m.end():]

    def card(rel, label, title, href, desc=None):
        d = f'<span class="k-pager-desc">{html.escape(desc)}</span>' if desc else ""
        return (f'<a class="k-pager-{rel}" rel="{rel}" href="{href}"><span class="k-pager-dir">{label}</span>'
                f'<span class="k-pager-title">{html.escape(title)}</span>{d}</a>')

    at = rows.index(me)
    prev = rows[at - 1] if at else None
    nxt = rows[at + 1] if at + 1 < len(rows) else None
    cards = []
    if prev:
        cards.append(card("prev", "Previous lesson", f'{prev["n"]}. {prev["title"]}', f'{up}{prev["folder"]}/3-page/3-page.html'))
    else:
        cards.append(card("prev", "The course", f"All {len(rows)} lessons", f"{up}index.html"))
    if nxt:
        cards.append(card("next", "Next lesson", f'{nxt["n"]}. {nxt["title"]}', f'{up}{nxt["folder"]}/3-page/3-page.html', teaser or nxt["bug"]))
    else:
        cards.append(card("next", "The course", f"All {len(rows)} lessons", f"{up}index.html"))
    pager = f'<nav class="k-pager" aria-label="Lessons">{"".join(cards)}</nav>\n\n  '
    return re.sub(r"<footer>", lambda _: pager + "<footer>", page, count=1)


def build(lesson, figures=True, drop_heading=None, append=None, working=None, still_text=None, more=None):
    lesson = Path(lesson).resolve()
    here = lesson / "3-page"
    if figures and (lesson / "2-figures" / "figures.mjs").exists():
        subprocess.run(["node", str(KIT / "build-figures.mjs"), str(lesson / "2-figures" / "figures.mjs")], check=True, stdout=subprocess.DEVNULL)
    prose = (lesson / "1-prose.md").read_text(encoding="utf-8")
    slots, missing = slots_for(lesson, prose)
    with tempfile.TemporaryDirectory() as tmp:
        args = []
        for name in re.findall(r"^\[\[([\w:-]+)\]\]\s*$", prose, re.M):
            path = Path(tmp) / f"{name.replace(':', '-')}.html"
            path.write_text(slots.get(name, f'<p class="pending">[pending: {name}]</p>'), encoding="utf-8")
            args += ["--slot", f"{name}={path}"]
        body = subprocess.run([sys.executable, str(LADDER / "scripts/prose.py"), str(lesson / "1-prose.md"), *args],
                              capture_output=True, text=True, check=True).stdout
    if drop_heading:
        body = re.sub(rf'(<section id="{re.escape(drop_heading)}">\n)<h2>.*?</h2>\n', r"\1", body, count=1)
    body = append_blocks(body, here, append)
    body = wrap_more(body, more)
    body = wrap_working(body, working)
    body = motion_text(body, still_text)
    page = chrome(fill((here / "shell.html").read_text(encoding="utf-8"), here, body), lesson)
    (here / "3-page.src.html").write_text(page, encoding="utf-8")
    subprocess.run(["node", str(LADDER / "scripts/math.mjs"), str(here / "3-page.src.html"), str(here / "3-page.html")], check=True)
    shutil.copyfile(LADDER / "assets/lesson.css", here / "lesson.css")
    html = keep_punctuation((here / "3-page.html").read_text(encoding="utf-8"))
    if not html.lstrip().lower().startswith("<!doctype"):
        html = '<!doctype html>\n<html lang="en">\n' + html.lstrip() + "\n</html>\n"
    (here / "3-page.html").write_text(html, encoding="utf-8")
    problems = check(html) + [f"missing slot {m}" for m in missing]
    print(f"{here / '3-page.html'}: {len(html) // 1024} KB, {len(slots)} slots filled")
    for p in problems:
        print(f"problem: {p}")
    return not problems


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("lesson")
    ap.add_argument("--no-figures", action="store_true", help="skip rebuilding 2-figures/")
    ap.add_argument("--drop-heading", help="section id whose h2 the page header already shows")
    a = ap.parse_args()
    sys.exit(0 if build(a.lesson, figures=not a.no_figures, drop_heading=a.drop_heading) else 1)


if __name__ == "__main__":
    main()
