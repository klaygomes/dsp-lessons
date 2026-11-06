import json
import subprocess
from pathlib import Path

here = Path(__file__).resolve().parent
out = here / "vo-breath"
out.mkdir(exist_ok=True)
lines = json.loads((here / "vo/lines.json").read_text())
lines[6] = dict(json.loads((here / "vo-fix5/lines.json").read_text())[0], i=7)
lines[7] = dict(json.loads((here / "vo-fix4/lines.json").read_text())[0], i=8)
lines[8] = dict(json.loads((here / "vo-fix5/lines.json").read_text())[1], i=9)
lines[7]["text"] = lines[7]["text"].replace("[HH AA1 N]", "Hann")


def ff(*args):
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", *args])


def rate(path):
    return int(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "stream=sample_rate", "-of", "csv=p=0", path]).decode().strip())


def splice(i, at, pad):
    L = lines[i - 1]
    src, dst = L["clip"], str(out / ("line%02d.wav" % i))
    sr = rate(src)
    graph = f"[0]atrim=0:{at},asetpts=N/SR/TB[a];anullsrc=r={sr}:cl=mono,atrim=0:{pad}[s];[0]atrim={at},asetpts=N/SR/TB[b];[a][s][b]concat=n=3:v=0:a=1[o]"
    ff("-i", src, "-filter_complex", graph, "-map", "[o]", dst)
    for w in L["words"]:
        if w["start"] >= at:
            w["start"] = round(w["start"] + pad, 3)
            w["end"] = round(w["end"] + pad, 3)
    L["clip"], L["dur"] = dst, round(L["dur"] + pad, 3)
    L["end"] = round(L.get("end", L["dur"]) + pad, 3) if "end" in L else L["dur"]


splice(5, 10.56, 0.5)
splice(8, 15.20, 0.5)
(here / "lines.final.json").write_text(json.dumps(lines, indent=1))
print("ok", lines[4]["dur"], lines[7]["dur"])
