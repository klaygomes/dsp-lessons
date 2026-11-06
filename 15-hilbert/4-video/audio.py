import json
import subprocess
from pathlib import Path

here = Path(__file__).resolve().parent
out = here / "vo-breath"
out.mkdir(exist_ok=True)
lines = json.loads((here / "lines.final.json").read_text())


def ff(*args):
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", *args])


def rate(path):
    return int(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "stream=sample_rate", "-of", "csv=p=0", path]).decode().strip())


def splice(i, at, pad):
    L = lines[i - 1]
    src, dst = L["clip"], str(out / Path(L["clip"]).name)
    sr = rate(src)
    graph = f"[0]atrim=0:{at},asetpts=N/SR/TB[a];anullsrc=r={sr}:cl=mono,atrim=0:{pad}[s];[0]atrim={at},asetpts=N/SR/TB[b];[a][s][b]concat=n=3:v=0:a=1[o]"
    ff("-i", src, "-filter_complex", graph, "-map", "[o]", dst)
    for w in L["words"]:
        if w["start"] >= at:
            w["start"] = round(w["start"] + pad, 3)
            w["end"] = round(w["end"] + pad, 3)
    L["clip"], L["dur"] = dst, round(L["dur"] + pad, 3)


def onset(i, token, nth, t):
    hits = [w for w in lines[i - 1]["words"] if w["word"].strip().rstrip(".,:") == token]
    hits[nth]["start"] = t


splice(8, 7.30, 0.5)
onset(11, "31", 0, 4.44)
onset(11, "35", 0, 8.71)
(here / "lines.final.json").write_text(json.dumps(lines, indent=1))
print("ok", lines[7]["dur"])
