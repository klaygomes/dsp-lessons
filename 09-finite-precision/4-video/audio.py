import json
import subprocess
from pathlib import Path

here = Path(__file__).resolve().parent
out = here / "vo-breath"
out.mkdir(exist_ok=True)
lines = json.loads((here / "lines.final.json").read_text())


def ff(*args):
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", *args])


def splice(src, dst, cuts):
    parts, last, inputs, n = [], 0.0, ["-i", src], 0
    graph = []
    for at, pad in cuts:
        graph.append(f"[0]atrim={last}:{at},asetpts=N/SR/TB[p{n}]")
        graph.append(f"anullsrc=r=24000:cl=mono,atrim=0:{pad}[s{n}]")
        parts += [f"[p{n}]", f"[s{n}]"]
        last, n = at, n + 1
    graph.append(f"[0]atrim={last},asetpts=N/SR/TB[p{n}]")
    parts.append(f"[p{n}]")
    graph.append("".join(parts) + f"concat=n={len(parts)}:v=0:a=1[o]")
    ff(*inputs, "-filter_complex", ";".join(graph), "-map", "[o]", dst)


def rate(path):
    return subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "stream=sample_rate", "-of", "csv=p=0", path]).decode().strip()


def breathe(i, after, pad, at=None):
    L = lines[i - 1]
    ws = L["words"]
    cuts = []
    for word in after:
        k = next(j for j, w in enumerate(ws) if w["word"].strip().lower().rstrip(".,") == word)
        cuts.append((at if at is not None else round((ws[k]["end"] + ws[k + 1]["start"]) / 2, 3), k))
    dst = str(out / Path(L["clip"]).name)
    splice(L["clip"], dst, [(at, pad) for at, _ in cuts])
    for n, (_, k) in enumerate(cuts):
        for w in ws[k + 1:]:
            w["start"] = round(w["start"] + pad, 3)
            w["end"] = round(w["end"] + pad, 3)
    L["clip"], L["dur"] = dst, round(L["dur"] + pad * len(cuts), 3)


def sigh(i, until, gain_db, pad):
    L = lines[i - 1]
    dst = str(out / Path(L["clip"]).name)
    tmp = str(out / "sigh_tmp.wav")
    ff("-i", L["clip"], "-af", f"volume={gain_db}dB:enable='lt(t,{until})'", tmp)
    splice(tmp, dst, [(until, pad)])
    Path(tmp).unlink()
    for w in L["words"]:
        w["start"] = round(w["start"] + pad, 3)
        w["end"] = round(w["end"] + pad, 3)
    L["words"][0]["start"] = round(until + pad + 0.05, 3)
    L["clip"], L["dur"] = dst, round(L["dur"] + pad, 3)


assert rate(lines[9]["clip"]) == "24000", rate(lines[9]["clip"])
breathe(4, [".8125"], 0.4, 9.4)
breathe(10, ["64", "inside"], 0.35)
sigh(11, 0.62, 1.5, 0.25)
(here / "lines.final.json").write_text(json.dumps(lines, indent=1))
print("ok", lines[3]["dur"], lines[9]["dur"], lines[10]["dur"])
