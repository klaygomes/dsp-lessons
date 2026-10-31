import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "splitting-eight-samples-by-hand", "from": "The figure walks the four odd arrows", "through": "The figure draws this butterfly with our numbers on it", "unlock": "predict-bin5", "auto": True,
         "note": "Answer the question above to see the odd part carried through to both bins."},
        {"section": "making-it-fit-on-the-chip", "from": "Now count. The chip does", "through": "about an eighth of what the chip can do", "unlock": "act2",
         "note": "The rest of this section counts how many splits the chip needs. It opens once you have made the detector fit in the lab under Your turn."},
    ],
    still_text={
        "The figure shows the grid filling, with the chip's share for one block outlined inside it":
            "The figure shows the full grid, with the chip's share for one block outlined inside it",
        "The figure steps the two wheels through the eight samples so you can watch it happen.":
            "The figure shows the two wheels at each of the eight samples.",
        "The figure walks the four odd arrows, turns the result, and lines it up with the even part.":
            "The figure shows the four odd arrows tip to tail, the result turned back, and both bins lined up with the even part.",
        "The figure splits eight samples all the way down to single samples, then builds them back up.":
            "The figure shows eight samples split all the way down to single samples, with the cost of stopping at each level.",
    },
)
sys.exit(0 if ok else 1)
