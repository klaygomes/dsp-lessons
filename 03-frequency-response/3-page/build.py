import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "the-frequency-response", "from": "The answer is less", "through": "In lesson 8", "unlock": "act1",
         "note": "This part gives the answer to the lab's question, names the frequency response and reads it off. It opens once you answer the question in the lab above, or ask it to show you the answer.",
         "button": "Show this part (opens after the lab's question)", "opened": "You have answered the lab's question, so this part is open to read."},
        {"section": "why-every-tone-comes-out-as-itself", "from": "Gain 0.488, phase 135°", "through": 'id="figure-arrows"', "unlock": "act1",
         "note": "The next paragraph and figure give the gain at 4,000 Hz, the lab's question. They open once you answer it.",
         "button": "Show this part (opens after the lab's question)", "opened": "You have answered the lab's question, so this part is open to read."},
        {"section": "boosting-what-the-wall-took", "from": "The fix falls straight out", "through": 'id="figure-cascade"', "unlock": "act2",
         "note": "The next part works out how to set a boost. It opens once you have fixed the west route in the lab below: find it yourself first."},
        {"section": "boosting-what-the-wall-took", "from": "boost needed</th>", "through": "Doubling everything", "unlock": "act2",
         "note": "The east route's boost for every band, worked out. It opens once you have fixed the west route in the lab below."},
        {"section": "recap", "from": "<ul>", "through": "</ul>", "unlock": "act2",
         "note": "The recap names the fix for the west route. It opens once you have fixed it in the lab above."},
    ],
)
sys.exit(0 if ok else 1)
