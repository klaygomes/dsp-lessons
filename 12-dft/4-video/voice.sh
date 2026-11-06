#!/bin/bash
LOCK=/private/tmp/claude-502/-Users-cleiton-loiola-personal-dsp-lessons/3d285345-5080-40c7-b733-e614ac72bcb9/scratchpad/voice.lock
HERE=/Users/cleiton.loiola/personal/dsp-lessons/12-dft/4-video
TXT=$HERE/$1
OUT=$HERE/$2
until mkdir "$LOCK" 2>/dev/null; do sleep 15; done
echo "lesson 12 $$" > "$LOCK/owner"
trap 'rm -f "$LOCK/owner"; rmdir "$LOCK"' EXIT
/Users/cleiton.loiola/.local/bin/agent-voice script "$TXT" --out "$OUT" --prompt /Users/cleiton.loiola/personal/dsp-lessons/01-signals-and-systems/4-video/vo/voice.pt --speed 1.1 --temperature 0.8
