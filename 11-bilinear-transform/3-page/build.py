import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "aim-before-you-squeeze", "from": "And the tones, on the manual", "through": 'id="figure-squeezed-prototype"', "unlock": "act2",
         "note": "The next table and picture show what the prewarped copy does to every other tone, which is the last question in the lab below. They open once you have fixed the copy there."},
    ],
    still_text={
        "A dot for the tone sweeps the top half from 0 Hz to 4,000 Hz.":
            "A dot for the tone rests at 2,363 Hz, and the faint arrow beside the rim shows its sweep from 0 Hz to 4,000 Hz.",
        "being squeezed onto the line.": "and where it lands on the line.",
    },
)
sys.exit(0 if ok else 1)
