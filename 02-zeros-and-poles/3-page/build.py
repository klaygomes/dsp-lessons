import base64
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
LESSON = HERE.parent
SKILL = Path.home() / ".claude/skills/klay-learning-ladder"


def diagram(name, caption):
    page = (LESSON / f"2-diagram-{name}.html").read_text(encoding="utf-8")
    style = re.search(r'<style id="\w+-style">.*?</style>', page, re.S).group(0)
    svg = re.search(r"<svg.*?</svg>", page, re.S).group(0)
    return f'{style}\n<figure class="figure"><div class="diagram">{svg}</div><figcaption>{caption}</figcaption></figure>'


def machine():
    fragment = LESSON / "2-machine" / "fragment.html"
    if fragment.exists():
        return f'<figure class="figure machine">{fragment.read_text(encoding="utf-8")}</figure>'
    return '<p class="pending">The filter test bench figure goes here.</p>'


def slot_file(name, text):
    path = HERE / f".slot-{name.replace(':', '-')}.html"
    path.write_text(text, encoding="utf-8")
    return f"{name}={path}"


slots = [
    slot_file("lab", (HERE / "lab.html").read_text(encoding="utf-8")),
    slot_file("lab-act2", (HERE / "lab-act2.html").read_text(encoding="utf-8")),
    slot_file("diagram:wheel", diagram("wheel", "Each tone turns the dot a fixed angle per sample. Reading its left-right position at every stop gives the tone's samples.")),
    slot_file("diagram:zero", diagram("zero", "The average's one zero sits at 4,000 Hz. How much of a tone passes is its distance to the zero, compared with 2, the distance of 0 Hz.")),
    slot_file("diagram:notch", diagram("notch", "Up close at the top of the circle: far from the notch, a tone's distances to the zero and to the pole nearly cancel. Only close to 2,000 Hz does the zero win.")),
    slot_file("machine", machine()),
]
body = subprocess.run([sys.executable, str(SKILL / "scripts/prose.py"), str(LESSON / "1-prose.md"), *sum((["--slot", s] for s in slots), [])],
                      capture_output=True, text=True, check=True).stdout
body = re.sub(r'<section id="a-new-complaint">\n<h2>A new complaint</h2>\n', '<section id="a-new-complaint">\n', body, count=1)

call = base64.b64encode((HERE / "call-8k.wav").read_bytes()).decode()
page = (HERE / "shell.html").read_text(encoding="utf-8")
page = page.replace("<!--BODY-->", body).replace("<!--CALL-->", call).replace("<!--LAB-->", (HERE / "lab.js").read_text(encoding="utf-8"))
(HERE / "3-page.src.html").write_text(page, encoding="utf-8")
subprocess.run(["node", str(SKILL / "scripts/math.mjs"), str(HERE / "3-page.src.html"), str(HERE / "3-page.html")], check=True)
for f in HERE.glob(".slot-*.html"):
    f.unlink()
