import math, struct, subprocess, sys
f, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
d = subprocess.check_output(["ffmpeg", "-v", "error", "-ss", str(a), "-to", str(b), "-i", f, "-ac", "1", "-ar", "1000", "-f", "s16le", "-"])
n = len(d) // 2
s = struct.unpack("<%dh" % n, d)
print(" ".join("%.2f:%.0f" % (a + i / 1000, 20 * math.log10(math.sqrt(sum(x * x for x in s[i:i + 40]) / 40) / 32768 + 1e-9)) for i in range(0, n - 39, 40)))
