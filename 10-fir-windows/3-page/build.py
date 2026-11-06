import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "cutting-it-short", "from": 'th scope="col">coefficients kept', "through": 'id="figure-truncation"', "unlock": "predict-zero", "auto": True,
         "note": "Make your prediction above to see the running total, pair by pair."},
        {"section": "a-window-with-soft-edges", "from": "plain cut, 45", "through": "the end of the slope", "unlock": "act2",
         "note": "Opens after you fix your own line."},
        {"section": "a-window-with-soft-edges", "from": "first moment still leaks", "through": "first moment still leaks", "unlock": "act2",
         "note": "Opens after you fix your own line."},
        {"section": "a-window-with-soft-edges", "from": "Why 45 and not fewer?", "through": "Why 45 and not fewer?", "unlock": "act2",
         "note": "Opens after you fix your own line."},
        {"section": "your-turn", "from": "The picture below is what done looks like", "through": 'id="figure-done"', "unlock": "act2",
         "note": "Opens after you fix your own line."},
    ],
    more=[{"section": "a-window-with-soft-edges", "from": "build the new filter with a pencil", "through": "−0.0017", "button": "Show the pencil table: the new coefficients, one by one"},
          {"section": "where-the-coefficients-come-from", "from": "Step one: the curve", "through": 'id="figure-gibbs-build"', "button": "Show the proof: four steps, a pencil check, and the pairs building the cliff"}],
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
