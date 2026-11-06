import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "one-tone-eight-samples", "from": "Test it. Take half", "through": 'id="figure-split"', "unlock": "predict-split", "auto": True,
         "note": "Answer the question above to see the guess tested, sample by sample."},
        {"section": "every-tone-is-two-arrows", "from": "Try it. The top arrow", "through": 'id="figure-ghost-arrows"', "unlock": "predict-one-arrow", "auto": True,
         "note": "Answer the question above to see what the single-arrow multiplier does."},
    ],
    more=[
        {"section": "building-the-hilbert-transformer", "from": "Where do those numbers come from", "through": 'id="figure-h-sketch"', "button": "Show where 2 ÷ (πn) comes from"},
        {"section": "the-shift-done-right", "from": "Here is the multiplication that gives it", "through": "The plain part is the shadow", "button": "Show the multiplication"},
        {"section": "the-delay-catch", "from": "Here is the arrow arithmetic", "through": "41% for θ = 675°", "button": "Show the arrow arithmetic"},
    ],
    still_text={
        "Watch the mirror arrow slow down as the top arrow speeds up, and watch its shadow, the ghost, slide down the spectrum.":
            "See the mirror arrow's turn per sample shrink as the top arrow's grows, and its shadow, the ghost, slide down the spectrum.",
    },
)
sys.exit(0 if ok else 1)
