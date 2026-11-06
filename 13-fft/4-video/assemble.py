import array
import json
import wave
from pathlib import Path

here = Path(__file__).resolve().parent


def load(p):
    w = wave.open(str(p))
    return w.getparams(), array.array("h", w.readframes(w.getnframes()))


def quietest(a, sr, t, span=0.08, win=0.02):
    n = int(win * sr)
    best = None
    for i in range(int((t - span) * sr), int((t + span) * sr) - n, n // 2):
        e = sum(v * v for v in a[i:i + n])
        if best is None or e < best[0]:
            best = (e, i + n // 2)
    return best[1]


old = json.loads((here / "vo" / "lines.json").read_text())
fix = json.loads((here / "vo-fix" / "lines.json").read_text())
texts = (here / "vo.txt").read_text().strip().split("\n")

p, a_old = load(here / "vo" / "line04.wav")
_, a_new = load(here / "vo-fix" / "line01.wav")
sr = p.framerate
c1, c2 = quietest(a_old, sr, 6.75), quietest(a_new, sr, 6.48)
out = a_old[:c1] + a_new[c2:]
o = wave.open(str(here / "vo-splice" / "line04.wav"), "wb")
o.setparams(p)
o.writeframes(out.tobytes())
o.close()
t1, t2 = c1 / sr, c2 / sr
tail = json.loads((here / "check" / "l4tail.json").read_text())["words"]
w4 = [w for w in old[3]["words"] if w["end"] <= t1 + 0.01]
w4 += [dict(w, start=round(w["start"] - t2 + t1, 3), end=round(w["end"] - t2 + t1, 3)) for w in fix[0]["words"] if w["start"] >= t2 - 0.01 and w["word"].strip() not in {".", ""}]
w4 += [dict(w, start=round(w["start"] + 11.4 - t2 + t1, 3), end=round(w["end"] + 11.4 - t2 + t1, 3)) for w in tail if w["word"] != "Step"]
line4 = dict(old[3], text=texts[3], clip=str(here / "vo-splice" / "line04.wav"), dur=round(len(out) / sr, 2), words=w4)

def breathed(i):
    shift = json.loads((here / "check" / ("breath%02d.json" % (i + 1))).read_text())
    ws = []
    for w in old[i]["words"]:
        d = sum(pause for at, pause in shift if w["start"] >= at - 0.01)
        ws.append(dict(w, start=round(w["start"] + d, 3), end=round(w["end"] + d, 3)))
    return dict(old[i], clip=str(here / "vo-breath" / ("line%02d.wav" % (i + 1))), dur=round(old[i]["dur"] + sum(x[1] for x in shift), 2), words=ws)


lines = list(old)
lines[2], lines[3], lines[4] = breathed(2), line4, breathed(4)
lines[8] = dict(fix[1], i=9, text=texts[8])
lines[9] = dict(fix[2], i=10, text=texts[9])
(here / "lines.final.json").write_text(json.dumps(lines, indent=1))
print(round(t1, 3), round(t2, 3), [round(l["dur"], 2) for l in lines])
