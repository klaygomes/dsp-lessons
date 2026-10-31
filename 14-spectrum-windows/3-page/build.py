import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    drop_heading=None,
    working=[
        {"section": "eight-samples-two-tones", "from": "<td>1,500 Hz</td>", "through": 'id="figure-leakage"', "unlock": "predict-split", "auto": True,
         "note": "Answer the question above to see the 1,500 Hz tone's matches."},
    ],
)
sys.exit(0 if ok else 1)
