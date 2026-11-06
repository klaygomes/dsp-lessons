import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    drop_heading=None,
    more=[
        {"section": "the-second-chain", "from": "The other bins work the same way", "through": "The other bins work the same way", "button": "The 2,000 and 3,000 Hz bins"},
        {"section": "the-keypad-at-256-samples", "from": "The long chain from 770 Hz into bin 27", "through": 'id="figure-phase-wobble"', "button": "The chains, one by one"},
        {"section": "why-the-leak-has-this-shape", "from": "Two reminders from lesson 6 first", "through": "the line we started from", "button": "Show the four steps"},
        {"section": "taper-the-edges", "from": "two mirror arrows, one bin", "through": 'id="figure-hann-three-curves"', "button": "Why exactly two bins"},
    ],
    working=[
        {"section": "eight-samples-two-tones", "from": "<td>1,500 Hz</td>", "through": 'id="figure-leakage"', "unlock": "predict-split", "auto": True,
         "note": "Answer the question above to see the 1,500 Hz tone's matches."},
    ],
)
out = Path(__file__).resolve().parent / "3-page.html"
text = out.read_text(encoding="utf-8")
text = re.sub(r"(<math>(?:(?!</math>).)*</math>)([,.:;)])", r'<span class="nowrap">\1\2</span>', text, flags=re.S)
out.write_text(text, encoding="utf-8")
sys.exit(0 if ok else 1)
