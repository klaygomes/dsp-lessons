import difflib
import json
import re
import sys
from pathlib import Path

ROW = 42
MAX_CUE = 3.8
WEAK = {"the", "a", "an", "of", "as", "and", "to", "far", "really", "its", "your", "at", "by", "in", "shifted", "every", "many", "what"}
NUM = {"0": "zero", "1": "one", "2": "two", "4": "four", "8": "eight", "2000": "two thousand", "8000": "eight thousand", ".4": "point four", ".2": "point two", ".8": "point eight", ".6": "point six", ".32": "point three two"}


def norm(tok):
    t = tok.lower().replace("’", "'").replace("“", "").replace("”", "")
    t = re.sub(r"[^a-z0-9.']", "", t).strip(".")
    return t


def whisper_tokens(words):
    out = []
    for w in words:
        raw = w["word"].strip().replace(",000", "000")
        key = re.sub(r"[^0-9.]", "", raw) if re.fullmatch(r"[0-9.,]+[.,?]?", raw) else None
        spoken = NUM.get(key.rstrip(".") if key else "", None) if key else None
        parts = (spoken or norm(raw)).split()
        for i, p in enumerate(parts):
            span = (w["end"] - w["start"]) / len(parts)
            out.append((p, w["start"] + i * span, w["start"] + (i + 1) * span))
    return out


def time_words(text, words, offset):
    shown = ["“hi”" if t == "hi" else t for t in re.sub(r"\[[^\]]*\]\s*", "", text).split()]
    tw = [norm(t) for t in shown]
    wt = whisper_tokens(words)
    sm = difflib.SequenceMatcher(a=tw, b=[w[0] for w in wt], autojunk=False)
    times = [None] * len(tw)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            times[a + k] = (wt[b + k][1], wt[b + k][2])
    known = [i for i, t in enumerate(times) if t]
    for i in range(len(tw)):
        if times[i]:
            continue
        lo = max([k for k in known if k < i], default=None)
        hi = min([k for k in known if k > i], default=None)
        t0 = times[lo][1] if lo is not None else 0.0
        t1 = times[hi][0] if hi is not None else words[-1]["end"]
        a = lo if lo is not None else -1
        b = hi if hi is not None else len(tw)
        f0, f1 = (i - a - 1) / (b - a - 1), (i - a) / (b - a - 1)
        times[i] = (t0 + (t1 - t0) * f0, t0 + (t1 - t0) * f1)
    return [(w, s + offset, e + offset) for w, (s, e) in zip(shown, times)]


def rows(words):
    text = " ".join(words)
    if len(text) <= ROW:
        return [text]
    best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        if len(a) > ROW or len(b) > ROW:
            continue
        score = abs(len(a) - len(b)) - (25 if words[i - 1][-1] in ",:;." else 0) + (40 if words[i - 1].lower() in WEAK else 0)
        if best is None or score < best[0]:
            best = (score, [a, b])
    return best[1] if best else None


def cues(timed):
    out, cur = [], []
    for k, item in enumerate(timed):
        trial = cur + [item]
        fits = rows([w for w, _, _ in trial]) is not None and trial[-1][2] - trial[0][1] <= MAX_CUE
        if cur and not fits:
            out.append(cur)
            trial = [item]
        cur = trial
        w = item[0]
        nxt = timed[k + 1] if k + 1 < len(timed) else None
        long_enough = len(" ".join(x for x, _, _ in cur)) >= 18
        if w[-1] in ".?!" or (w[-1] in ",:" and long_enough) or nxt is None:
            out.append(cur)
            cur = []
    merged = []
    for c in out:
        if merged and len(" ".join(w for w, _, _ in c)) < 14:
            both = merged[-1] + c
            if rows([w for w, _, _ in both]) and both[-1][2] - both[0][1] <= MAX_CUE + 0.6:
                merged[-1] = both
                continue
        merged.append(c)
    return merged


def stamp(s):
    return "%02d:%02d:%06.3f" % (s // 3600, s % 3600 // 60, s % 60)


def main():
    here = Path(sys.argv[1]).resolve()
    sched = json.loads((here / "schedule.json").read_text())
    lines = json.loads((here / "lines.final.json").read_text())
    blocks, n = ["WEBVTT", ""], 0
    for p, line in zip(sched["lines"], lines):
        timed = time_words(line["text"], line["words"], p["start"])
        group = cues(timed)
        for j, c in enumerate(group):
            n += 1
            start = c[0][1]
            end = c[-1][2] + 0.1
            if j + 1 < len(group):
                end = min(end, group[j + 1][0][1] - 0.02)
            blocks += [str(n), "%s --> %s" % (stamp(start), stamp(end)), *rows([w for w, _, _ in c]), ""]
    (here / "final.vtt").write_text("\n".join(blocks))
    print("cues", n)


if __name__ == "__main__":
    main()
