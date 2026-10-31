import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "your-turn", "from": "The picture below is what done looks like", "through": 'id="figure-done"', "unlock": "act2",
         "note": "The next picture shows the answer for your own line. It opens once you have fixed your own line in the lab above."},
    ],
    still_text={
        "The animation below shows the two arrows turning opposite ways, with their sum sliding along the flat line. It ends on one frozen frame, the arrows at 30° with their flat sum marked.":
            "The figure below shows the two arrows turned opposite ways, 30° each, with curved arrows for the way each one turned, and their flat sum marked.",
        "The animation below adds the pairs one at a time.":
            "The figure below overlays the curves for 3, 7, 15 and 31 coefficients.",
        "The animation below slides the rectangle's hump across the cliff, drawing the 9% bump, then slides the Hamming hump and draws a gentle slope instead.":
            "The figure below shows each hump parked at the cliff with the curve its slide draws: the rectangle's hump draws the 9% bump, the Hamming hump a gentle slope instead.",
    },
)
sys.exit(0 if ok else 1)
