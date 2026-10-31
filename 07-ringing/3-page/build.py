import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "one-click-sample-by-sample", "from": 'th scope="col">0.905 (x[n]', "through": 'id="figure-click-ring"', "unlock": "predict-ring", "auto": True,
         "note": "Make your prediction above to see the notch's answer, sample by sample, and what it means."},
        {"section": "how-long-a-ring-lasts", "from": 'th scope="col">decay time, samples', "through": 'id="figure-pole-gaps"', "unlock": "act1", "auto": True,
         "note": "The table and the figure here give away the answers to the questions in the lab just below. They open once you have answered both there."},
        {"section": "your-turn", "from": "You show the lead the curve", "through": "and the whine still at 0%", "unlock": "act2a", "auto": True,
         "note": "The next step of the story opens once you have decided, in the lab below, what to take to the support lead."},
        {"section": "your-turn", "from": 'id="figure-radius-strip"', "through": 'id="figure-radius-strip"', "unlock": "act2",
         "note": "This figure gives away the lab's answer. It opens once you have fixed the line in the lab below."},
        {"section": "next-on-the-line", "from": "The tink is still there", "through": "The tink is still there", "unlock": "act2",
         "note": "The first lines of the next story give away how the fix turns out. They open once you have fixed the line in the lab above."},
        {"section": "your-turn", "from": "Any radius from 0.816", "through": "keeps 93%", "unlock": "act2",
         "note": "One more paragraph about the fix opens here once you have solved the lab."},
    ],
)
sys.exit(0 if ok else 1)
