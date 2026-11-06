import array
import json
import sys
import wave
from pathlib import Path

here = Path(__file__).resolve().parent
src, dst, cuts = here / "vo" / sys.argv[1], here / "vo-breath" / sys.argv[1], [tuple(map(float, c.split(":"))) for c in sys.argv[2:]]
w = wave.open(str(src))
p = w.getparams()
a = array.array("h", w.readframes(p.nframes))
sr = p.framerate


def quietest(t0, t1, win=0.02):
    best = None
    n = int(win * sr)
    for i in range(int(t0 * sr), int(t1 * sr) - n, n // 2):
        e = sum(v * v for v in a[i:i + n])
        if best is None or e < best[0]:
            best = (e, i + n // 2)
    return best[1]


points = sorted((quietest(t - 0.08, t + 0.08), pause) for t, pause in cuts)
out, last = array.array("h"), 0
for at, pause in points:
    out.extend(a[last:at])
    out.extend(array.array("h", [0] * int(pause * sr)))
    last = at
out.extend(a[last:])
o = wave.open(str(dst), "wb")
o.setparams(p)
o.writeframes(out.tobytes())
o.close()
print(json.dumps([[round(at / sr, 3), pause] for at, pause in points]))
