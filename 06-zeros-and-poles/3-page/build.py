import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "_kit"))
import page

shutil.copyfile(HERE.parent / "2-machine" / "fragment.html", HERE / "machine.html")

ok = page.build(
    HERE.parent,
    still_text={
        "Watch each pair of neighbors collapse into one output stem.":
            "The figure shows each pair of neighbors collapsed into one output stem.",
        "Watch the thread unroll along a ruler as the dot walks the rim.":
            "The figure shows the walk along the rim laid flat on a ruler.",
        "Watch one dot sweep the top half, leaving a fixed home for a tone every 1,000 Hz.":
            "The figure shows the top half with a fixed home for a tone every 1,000 Hz.",
        "Watch the angles stack end to end while the lengths multiply.":
            "The figure shows the angles stacked end to end and the lengths multiplied.",
        "Watch the arrow's shadow write the samples beside it.":
            "The figure shows the arrow's shadow written out as the samples beside it.",
        "Watch the older dot trail the fresh one by the same arc.":
            "The figure shows the older dot trailing the fresh one by the same arc.",
    },
)
sys.exit(0 if ok else 1)
