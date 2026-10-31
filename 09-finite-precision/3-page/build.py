import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "worked-example-1-lesson-6-s-notch-survives", "from": "(Spoiler, for readers", "through": "(Spoiler, for readers", "unlock": "act1",
         "note": "The answer to the lab's first question is written here. It opens once you have answered it.",
         "button": "Show the answer (opens after the lab's question)", "opened": "You have answered it, so the answer is open to read."},
        {"section": "worked-example-2-the-three-notch-rule-on-the-chip", "from": "But the zeros aren't what makes the hum", "through": "gives each pole its own direction", "unlock": "predict-drift", "auto": True,
         "note": "Answer the question above to see where the poles land."},
    ],
    still_text={
        "The figure draws both sets of poles on the unit circle. Watch the two outer pairs cross the rim.":
            "The figure shows both sets of poles on the unit circle, with arrows from each laptop pole to where the chip puts it: the two outer pairs end up outside the rim.",
        "The animation multiplies the three notches one at a time and shows the coefficients piling up.":
            "The figure multiplies the three notches one at a time and shows the coefficients piling up.",
    },
)
sys.exit(0 if ok else 1)
