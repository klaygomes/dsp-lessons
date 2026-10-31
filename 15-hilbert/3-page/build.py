import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "one-tone-eight-samples", "from": "Here's a guess worth testing", "through": 'id="figure-split"', "unlock": "predict-split", "auto": True,
         "note": "Answer the question above to see the guess tested, sample by sample."},
        {"section": "every-tone-is-two-arrows", "from": "Try it. The top arrow", "through": 'id="figure-ghost-arrows"', "unlock": "predict-one-arrow", "auto": True,
         "note": "Answer the question above to see what the single-arrow multiplier does."},
    ],
    still_text={
        "Watch the mirror arrow slow down as the top arrow speeds up, and watch its shadow, the ghost, slide down the spectrum.":
            "See the mirror arrow's turn per sample shrink as the top arrow's grows, and its shadow, the ghost, slide down the spectrum.",
    },
)
sys.exit(0 if ok else 1)
