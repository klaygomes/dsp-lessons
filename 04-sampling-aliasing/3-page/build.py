import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "_kit"))
import page

HERE = Path(__file__).resolve().parent
kit_figure = page.figure


def figure(fig_dir, name, meta):
    extra = HERE / f"after-{name}.html"
    html = kit_figure(fig_dir, name, meta)
    return html + "\n" + extra.read_text(encoding="utf-8") if extra.exists() else html


page.figure = figure

ok = page.build(
    HERE.parent,
    append={"what-the-phone-stores": "ask-list"},
    working=[{"section": "the-limit-and-the-alias", "from": "Here's what the lab shows", "through": 'id="figure-turn-round"', "unlock": "act1",
              "note": "The next paragraph and figure sum up what the lab shows. They open once you have answered the lab's three questions."},
             {"section": "why-you-can-t-fix-it-afterwards", "from": "So the fix has to happen before sampling", "through": "With the filter in place", "unlock": "act2",
              "note": "The rest of this section works out the fix you will find yourself in the lab at the end of the lesson. It opens once you have fixed the line."},
             {"section": "your-turn", "from": "If you tried the filter after the sampler", "through": "the same filter wins easily", "unlock": "act2",
              "note": "The next paragraph says how the fix works. It opens once you have fixed the line in the lab above."}],
)
sys.exit(0 if ok else 1)
