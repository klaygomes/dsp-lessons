import sys,re
d={}
for l in open(sys.argv[1]):
    m=re.match(r'([\d.]+) safe/band: (.*) (-?\d+),(-?\d+),(-?\d+),(-?\d+)$',l.strip())
    if not m: 
        if 'overlap' in l or 'done' in l or 'misses' in l: print(l.strip())
        continue
    t,txt=float(m.group(1)),m.group(2); x0,x1,y0,y1=map(int,m.group(3,4,5,6))
    k=(txt); o=d.get(k,[t,t,9e9,9e9,-9e9,-9e9]); d[k]=[min(o[0],t),max(o[1],t),min(o[2],x0),min(o[3],y0),max(o[4],x1),max(o[5],y1)]
for k,v in sorted(d.items(),key=lambda x:x[1][0]): print('%6.1f-%6.1f  %-40s x0 %d y0 %d x1 %d y1 %d'%(v[0],v[1],k,v[2],v[3],v[4],v[5]))
