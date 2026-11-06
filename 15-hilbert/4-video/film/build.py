import json
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
source = Path(sys.argv[1]) if len(sys.argv) > 1 else here.parent / "schedule.json"
schedule = json.loads(source.read_text())
src = (here / "index.src.html").read_text()
(here / "index.html").write_text(src.replace("/*SCHEDULE*/null", json.dumps(schedule, separators=(",", ":"))))
