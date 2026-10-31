import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

TONE = {"unlock": "tone", "button": "Show the working (opens after the tone question)",
        "opened": "You have answered the tone question, so this part is open to read."}

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "how-exact-must-the-guess-be", "from": "The next table gives the steady tone", "through": "The click gives you the exact sample.",
         "note": "This part answers the tone question above. It opens once you have answered it.", **TONE},
        {"section": "how-exact-must-the-guess-be", "from": "A real voice lands near the slow end", "through": "A real voice lands near the slow end", "unlock": "act2",
         "note": "The next sentence answers the lab's last prediction. It opens once you have fixed the line in the lab below."},
        {"section": "your-turn", "from": "Then, if you like, slip the delay by one", "through": "Then, if you like, slip the delay by one",
         "note": "One more check for later. It gives away the tone question in the section above, so it opens once you have answered that question.", **TONE},
    ],
)
sys.exit(0 if ok else 1)
