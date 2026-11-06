import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "worked-example-1-lesson-6-s-notch-survives", "from": "(The answer, in words", "through": "(The answer, in words", "unlock": "act1", "auto": True,
         "note": "The answer to the lab's first question is written here. It opens once you have answered it."},
        {"section": "worked-example-2-the-three-notch-rule-on-the-chip", "from": "But the zeros aren't what makes the hum", "through": "gives each pole its own direction", "unlock": "predict-drift", "auto": True,
         "note": "Answer the question above to see where the poles land."},
    ],
    more=[
        {"section": "why-crowded-poles-jump", "from": "Where does the rule come from?", "through": "A move that big is far outside", "button": "Show where the rule comes from"},
        {"section": "the-fix-keep-each-pair-alone", "from": "Two questions the book asks", "through": "Two questions the book asks", "button": "Show more: section order and headroom"},
        {"section": "would-more-bits-save-it", "from": "Why does a pole on the circle ring", "through": "Why does a pole on the circle ring", "button": "Show why it rings, and where the zeros go"},
    ],
    still_text={
        "The figure draws both sets of poles on the unit circle. Watch the two outer pairs cross the rim.":
            "The figure shows both sets of poles on the unit circle, with arrows from each laptop pole to where the chip puts it: the two outer pairs end up outside the rim.",
        "The animation multiplies the three notches one at a time and shows the coefficients piling up.":
            "The figure multiplies the three notches one at a time and shows the coefficients piling up.",
    },
)
sys.exit(0 if ok else 1)
