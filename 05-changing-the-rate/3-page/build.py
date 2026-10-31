import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

ok = page.build(
    Path(__file__).resolve().parents[1],
    working=[
        {"section": "filling-the-gaps", "from": "Look closely at the long ones", "through": "Keep an eye on that ripple", "unlock": "act2",
         "note": "The next paragraph reads the long rules off the figure, numbers included, and they decide the lab’s fix. It opens once you have fixed the bridge in the lab below."},
        {"section": "the-other-direction", "from": "On the wideband line, 6,000 Hz turns", "through": "Downsampling folds a tone onto its mirror", "unlock": "ds-guess",
         "note": "The tables, the figure and the paragraph below work out what arrives. They open once you have made your guess above."},
        {"section": "next-on-the-line", "from": "The bridge is clean", "through": "Nobody has complained", "unlock": "act2",
         "note": "The first lines here name the rule that fixes the bridge. They open once you have fixed it in the lab above."},
        {"section": "your-turn", "from": 'id="figure-target"', "through": 'id="figure-target"', "unlock": "act2",
         "note": "The figure here shows which rule meets the spec. It opens once you have fixed the bridge in the lab below."},
    ],
)
sys.exit(0 if ok else 1)
