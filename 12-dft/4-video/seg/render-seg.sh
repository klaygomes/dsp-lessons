#!/bin/bash
H=/Users/cleiton.loiola/personal/dsp-lessons/12-dft/4-video
R=/Users/cleiton.loiola/.local/share/klay-learning-ladder/motionmaxxing/scripts/render.mjs
B=(0 30 60 90 120 141.18)
for i in 0 1 2 3 4; do
  out=$H/seg/part$i.mp4
  [ -s $out.ok ] && continue
  for try in 1 2 3 4; do
    node $R $H/film/index.html $out --from ${B[$i]} --to ${B[$((i+1))]} > $H/seg/part$i.log 2>&1
    d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $out 2>/dev/null)
    want=$(python3 -c "print(${B[$((i+1))]}-${B[$i]})")
    if python3 -c "import sys; sys.exit(0 if abs(float('${d:-0}')-$want)<0.1 else 1)"; then echo ok > $out.ok; echo "part$i ok $d"; break; fi
    echo "part$i try $try failed ($d)"
  done
done
