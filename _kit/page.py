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


def wrap_working(body, working):
    for w in working or []:
        start, end = section_bounds(body, w["section"])
        a = body.index(w["from"], start, end)
        a = body.rindex("\n", start, a) + 1
        b = body.index(w["through"], a, end)
        if body.rfind("<figure", a, b) > body.rfind("</figure>", a, b):
            b = body.index("</figure>", b) + len("</figure>")
        b = body.index("\n", b)
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


def build(lesson, figures=True, drop_heading=None, append=None, working=None, still_text=None):
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
    body = wrap_working(body, working)
    body = motion_text(body, still_text)
    page = fill((here / "shell.html").read_text(encoding="utf-8"), here, body)
    (here / "3-page.src.html").write_text(page, encoding="utf-8")
    subprocess.run(["node", str(LADDER / "scripts/math.mjs"), str(here / "3-page.src.html"), str(here / "3-page.html")], check=True)
    shutil.copyfile(LADDER / "assets/lesson.css", here / "lesson.css")
    html = (here / "3-page.html").read_text(encoding="utf-8")
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
