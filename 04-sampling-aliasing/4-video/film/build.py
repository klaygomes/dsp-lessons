import json
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
schedule = json.loads((here.parent / "schedule.json").read_text())
src = (here / "index.src.html").read_text()
(here / "index.html").write_text(src.replace("/*SCHEDULE*/null", json.dumps(schedule, separators=(",", ":"))))
sys.exit(0)
