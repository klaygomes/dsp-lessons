import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "group-delay-the-slope-of-the-phase", "from": '<th scope="col">1,650 Hz</th>', "through": '<th scope="col">1,650 Hz</th>', "unlock": "act1", "auto": True,
         "note": "This table gives the answer to the first lab question. It opens once you have answered it in the lab above."},
    ],
    still_text={
        "The animation shows the chase: two dots, the faster one catching up, and the sum wave underneath swelling each time they meet. Then it runs the same tones through the notch.":
            "The figure shows the chase: two dots lined up at sample 1,600, the sum wave underneath swelling where they meet, and the same tones after the notch.",
        "The figure shows the notch's phase curve with that straight line, first through 1,700 and 1,800 Hz, then tilting as the two tones close in until it touches the curve.":
            "The figure shows the notch's phase curve with its points at 1,700 and 1,800 Hz (11.6° ÷ 4.5° = 2.58 samples) and the line the straight line tilts into as the two tones close in, touching the curve at 1,750 Hz.",
    },
)
sys.exit(0 if ok else 1)
