import json, subprocess, sys
from pathlib import Path

def splice(src, dst, at, pad):
    sr = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "stream=sample_rate,channels", "-of", "csv=p=0", src]).decode().split(",")
    rate, ch = sr[0].strip(), sr[1].strip()
    lay = "mono" if ch == "1" else "stereo"
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", src, "-f", "lavfi", "-t", str(pad), "-i", f"anullsrc=r={rate}:cl={lay}",
        "-filter_complex", f"[0]atrim=0:{at},asetpts=N/SR/TB[a];[0]atrim={at},asetpts=N/SR/TB[b];[a][1][b]concat=n=3:v=0:a=1", dst])

def main():
    idx, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    lines = json.loads(idx.read_text())
    out_dir.mkdir(exist_ok=True)
    for spec in sys.argv[3:]:
        n, after, pad = spec.split(":")
        n, pad = int(n), float(pad)
        L = lines[n - 1]
        ws = L["words"]
        k = next(i for i, w in enumerate(ws) if w["word"].strip().lower().rstrip(".,") == after.lower())
        at = round((ws[k]["end"] + ws[k + 1]["start"]) / 2, 3)
        dst = out_dir / Path(L["clip"]).name
        src = L["clip"] if not Path(dst).exists() or L["clip"] != str(dst.resolve()) else None
        tmp = out_dir / ("tmp_" + dst.name)
        splice(L["clip"], str(tmp), at, pad)
        tmp.replace(dst)
        for w in ws[k + 1:]:
            w["start"] = round(w["start"] + pad, 3); w["end"] = round(w["end"] + pad, 3)
        L["clip"] = str(dst.resolve())
        L["dur"] = round(L["dur"] + pad, 3)
        L["end"] = round(L.get("end", L["dur"]) + pad, 3)
        print(f"line {n}: +{pad}s after '{ws[k]['word']}' at {at}s -> {dst}")
    idx.write_text(json.dumps(lines, indent=1, ensure_ascii=False))

main()
