import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "a-tiny-echo-sample-by-sample", "from": "Start with 2,000 Hz", "through": "An echo, seen tone by tone", "unlock": "predict-every-tone", "auto": True,
         "note": "Answer the question above to see the guess tested, tone by tone."},
        {"section": "why-the-echo-ripples", "from": "Why every 2,000 Hz", "through": "An echo D samples late puts a ripple", "unlock": "predict-every-tone", "auto": True,
         "note": "This part explains the answer to the question in the section above. It opens once you have answered it."},
        {"section": "why-the-echo-ripples", "from": "For our tiny echo, 8,000", "through": "Notice which way that goes", "unlock": "a1-q1", "auto": True,
         "note": "This part works the rule out for longer delays. It opens once you answer the first question in the lab below."},
    ],
    still_text={
        "Watch it move. In the figure, the original arrow stays put and the echo's half-size arrow hangs off its tip. As the tone rises, the echo arrow swings round, and the length of the sum traces the ripple.":
            "In the figure, the original arrow stays put and the echo's half-size arrow hangs off its tip, shown at 500, 1,000 and 2,000 Hz. The higher the tone, the further round the echo arrow sits, and the length of the sum traces the ripple.",
        "The figure animates exactly that: the tone's dot goes once round, the echo's dot laps it 4 times, and beside them the log ripple draws itself, 4 bumps for 4 laps.":
            "The figure shows exactly that: the tone's dot at each quarter of the way round, the echo's dot back at the start after each of its 4 laps, and beside them the log ripple, 4 bumps for 4 laps.",
    },
)
sys.exit(0 if ok else 1)
