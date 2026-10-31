import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    append={"what-the-booster-breaks": "systems"},
    working=[
        {"section": "the-booster", "from": "Let's run both", "through": "it is not a pure 1,000 Hz tone", "unlock": "predict-clean", "auto": True,
         "note": "Answer the question above to see both callers run sample by sample."},
        {"section": "your-turn", "from": "The fix follows from everything above", "through": 'id="figure-fix"', "unlock": "own-line",
         "note": "The next paragraphs and figure work out the setting for your own line. They open once you have fixed your own line in the lab below."},
        {"section": "your-turn", "from": "You'll notice the trade", "through": "taken back out", "unlock": "own-line",
         "note": "One more paragraph about the fix opens here once you have solved the lab."},
    ],
    still_text={
        "In the next figure, watch the smooth voltage get measured at evenly spaced moments. When the curve fades, only the dots are left.":
            "The next figure shows the smooth voltage measured at evenly spaced moments. Only the dots are kept; the dashed curve is the wave they came from.",
        "The next figure plays both callers growing by 4 inside the shaded band from −1 to +1. Watch the loud one's stems cross the band's edge and get pushed back onto it.":
            "The next figure shows both callers after growing by 4, inside the shaded band from −1 to +1. The loud one's stems crossed the band's edge (drawn faint) and were pushed back onto it.",
        "Watch the figure: each boosted voice sits safely inside the band, then the two slide together, and their sum pokes out and is cut flat.":
            "In the figure, each boosted voice sits safely inside the band, while their sum pokes out and is cut flat.",
        "and watch the figure build the row like falling dominoes":
            "and the figure shows the row built like falling dominoes",
        "The figure turns the two knobs until the wave passes through both dots.":
            "The figure shows the two knobs set so the wave passes through both dots.",
    },
)
sys.exit(0 if ok else 1)
