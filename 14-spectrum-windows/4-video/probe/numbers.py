import cmath, math
FS = 8000
def match(tones, N, k, win=False):
    w = [0.5 - 0.5*math.cos(2*math.pi*n/N) if win else 1 for n in range(N)]
    s = sum(w[n]*sum(a*math.cos(2*math.pi*f*n/FS+p) for f,a,p in tones)*cmath.exp(-2j*math.pi*k*n/N) for n in range(N))
    return abs(s)/(sum(w)/2)
print('napkin 1000', [round(100*match([(1000,1,0)],8,k)) for k in range(5)])
print('napkin 1500', [round(100*match([(1500,1,0)],8,k)) for k in range(5)])
bins = [round(f*256/FS) for f in (697,770,852,941,1209,1336,1477,1633)]
print('bins', bins)
best = None
for i in range(16):
  for j in range(16):
    v = [match([(770,1,2*math.pi*i/16),(1209,1,2*math.pi*j/16)],256,k) for k in bins]
    if best is None or v[2] > best[0][2]: best=(v,i,j)
print('loud4 max852', [round(100*x,1) for x in best[0]], best[1:])
print('faint5', [round(100*match([(770,.1,0),(1336,.1,0)],256,k),1) for k in bins])
print('hann loud4', [round(100*match([(770,1,2*math.pi*best[1]/16),(1209,1,2*math.pi*best[2]/16)],256,k,True),1) for k in bins])
print('hann faint5', [round(100*match([(770,.1,0),(1336,.1,0)],256,k,True),1) for k in bins])
