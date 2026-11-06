import difflib
import json
import re
import sys
from pathlib import Path

ROW = 42
MAX_CUE = 4.4
WEAK = {"undo", "almost", "half", "more", "gap's", "one", "two", "three", "four", "five", "eight", "sixteen", "forty-five", "twenty-five", "thirty-five", "hundred", "thousand", "with", "into", "that", "can't", "turning", "still", "above", "full", "false", "for", "crosses", "left", "trails", "those", "how", "from", "comes", "seventy", "neighboring", "is", "the", "a", "an", "of", "as", "and", "to", "far", "really", "its", "your", "at", "by", "in", "shifted", "every", "many", "what"}
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
ALIAS = {"hz": "hertz", "root": "route", "%": "percent"}


def say_int(n):
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + say_int(n % 100))
    return say_int(n // 1000) + " thousand" + ("" if n % 1000 == 0 else " " + say_int(n % 1000))


def spoken(raw):
    t = raw.strip().rstrip(".,?!:").replace(",", "")
    pct = t.endswith("%")
    t = t.rstrip("%")
    if re.fullmatch(r"\d+", t):
        out = say_int(int(t))
    elif re.fullmatch(r"\d*\.\d+", t):
        a, b = t.split(".")
        out = (say_int(int(a)) + " " if a else "") + "point " + " ".join(ONES[int(c)] for c in b)
    elif t == "":
        out = "percent" if pct else None
        return out
    else:
        return None
    return out + (" percent" if pct else "")


def norm(tok):
    t = tok.lower().replace("’", "'").replace("“", "").replace("”", "")
    t = re.sub(r"[^a-z0-9.']", "", t).strip(".")
    return t


def whisper_tokens(words):
    merged = []
    for w in words:
        if merged and re.fullmatch(r",000[.,?]?", w["word"].strip()):
            merged[-1] = dict(merged[-1], word=merged[-1]["word"].strip() + w["word"].strip(), end=w["end"])
        else:
            merged.append(dict(w))
    out = []
    for w in merged:
        raw = w["word"].strip()
        parts = (spoken(raw) or ALIAS.get(norm(raw), norm(raw))).split()
        for i, p in enumerate(parts):
            span = (w["end"] - w["start"]) / len(parts)
            out.append((p, w["start"] + i * span, w["start"] + (i + 1) * span))
    return out


def time_words(text, words, offset):
    shown = re.sub(r"\[[^\]]*\]\s*", "", text).split()
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


NUMW = set(ONES + TENS[2:] + ["hundred", "thousand", "point"]) | {t + "-" + o for t in TENS[2:] for o in ONES[1:10]}


def join_numbers(timed):
    out = []
    for w, a, b in timed:
        bare = w.lower().rstrip(".,?!:")
        if out and bare in NUMW and out[-1][0].split("\u00a0")[-1].lower() in NUMW and out[-1][0] == out[-1][0].rstrip(".,?!:"):
            pw, pa, _ = out[-1]
            out[-1] = (pw + "\u00a0" + w, pa, b)
        else:
            out.append((w, a, b))
    return out


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
        rr = rows([w for w, _, _ in trial])
        fits = rr is not None and trial[-1][2] - trial[0][1] <= MAX_CUE and not (len(rr) == 2 and rr[0].split()[-1].lower() in WEAK)
        if cur and not fits:
            carry = []
            while len(cur) > 1 and cur[-1][0].lower() in WEAK:
                carry.insert(0, cur.pop())
            out.append(cur)
            trial = carry + [item]
        cur = trial
        w = item[0]
        nxt = timed[k + 1] if k + 1 < len(timed) else None
        long_enough = len(" ".join(x for x, _, _ in cur)) >= 18
        if w[-1] in ".?!" or (w[-1] in ",:" and long_enough) or nxt is None:
            out.append(cur)
            cur = []
    def dur(c):
        return c[-1][2] - c[0][1]

    def fits(both):
        rr = rows([w for w, _, _ in both])
        return rr and not (len(rr) == 2 and rr[0].split()[-1].lower() in WEAK) and dur(both) <= MAX_CUE + 0.6

    merged = []
    for c in out:
        if merged:
            prev = merged[-1]
            short = len(" ".join(w for w, _, _ in c)) < 14 or dur(c) < 1.2 or dur(prev) < 1.2
            open_end = prev[-1][0][-1] not in ".?!" or len(" ".join(w for w, _, _ in c)) < 14
            if short and open_end and fits(prev + c):
                merged[-1] = prev + c
                continue
        merged.append(c)
    out = []
    for c in merged:
        if out and len(" ".join(w for w, _, _ in c)) < 8 and rows([w for w, _, _ in out[-1] + c]) and dur(out[-1] + c) <= MAX_CUE + 2:
            out[-1] = out[-1] + c
            continue
        out.append(c)
    for k in range(1, len(out)):
        c, prev = out[k], out[k - 1]
        if dur(c) >= 1.0:
            continue
        for cut in range(len(prev) - 1, 0, -1):
            if prev[cut - 1][0][-1] not in ",:;":
                continue
            head, tail = prev[:cut], prev[cut:] + c
            if rows([w for w, _, _ in head]) and rows([w for w, _, _ in tail]) and dur(tail) <= MAX_CUE + 0.6:
                out[k - 1], out[k] = head, tail
                break
    return out


def stamp(s):
    return "%02d:%02d:%06.3f" % (s // 3600, s % 3600 // 60, s % 60)


def main():
    here = Path(sys.argv[1]).resolve()
    sched = json.loads((here / "schedule.json").read_text())
    lines = json.loads((here / "lines.final.json").read_text())
    blocks, n = ["WEBVTT", ""], 0
    for p, line in zip(sched["lines"], lines):
        timed = time_words(line["text"], line["words"], p["start"])
        group = cues(join_numbers(timed))
        for j, c in enumerate(group):
            n += 1
            start = c[0][1]
            end = c[-1][2] + 0.1
            if j + 1 < len(group):
                end = min(end, group[j + 1][0][1] - 0.02)
            blocks += [str(n), "%s --> %s" % (stamp(start), stamp(end)), *[r.replace("\u00a0", " ") for r in rows([w for w, _, _ in c])], ""]
    (here / "final.vtt").write_text("\n".join(blocks))
    print("cues", n)


if __name__ == "__main__":
    main()
