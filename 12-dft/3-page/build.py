import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "asking-one-tone-a-question", "from": 'th scope="col">sum', "through": 'id="figure-test-tone"', "unlock": "predict-sum", "auto": True,
         "note": "Make your guess above to see the table and the figure that work it out."},
    ],
    still_text={
        "In the figure, the dot's starting point slides from the right to the bottom, and the arrow swings with it, its length fixed at 4.":
            "The figure shows the dot starting at the right, 45° below it and at the bottom, and the arrow for each start points the same way, its length fixed at 4.",
        "The figure shows the two arrows turning opposite ways while the spot where they land slides along the horizontal line.":
            "The figure shows three moments of the two arrows, turned opposite ways, and the spot where they land on the horizontal line.",
        "The figure steps these five wheels through the eight samples.":
            "The figure marks where each of these five wheels stops at each of the eight samples.",
    },
)
sys.exit(0 if ok else 1)
