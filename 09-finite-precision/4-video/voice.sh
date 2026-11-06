#!/bin/bash
LOCK=/private/tmp/claude-502/-Users-cleiton-loiola-personal-dsp-lessons/3d285345-5080-40c7-b733-e614ac72bcb9/scratchpad/voice.lock
HERE=/Users/cleiton.loiola/personal/dsp-lessons/09-finite-precision/4-video
PROMPT=/Users/cleiton.loiola/personal/dsp-lessons/01-signals-and-systems/4-video/vo/voice.pt
TXT="$HERE/$1"
OUT="$HERE/$2"
until mkdir "$LOCK" 2>/dev/null; do sleep 15; done
echo "lesson 9 $$" > "$LOCK/owner"
release() { rm -f "$LOCK/owner"; rmdir "$LOCK"; }
trap release EXIT
trap "exit 1" INT TERM HUP
echo "lock taken $(date)"
/Users/cleiton.loiola/.local/bin/agent-voice script "$TXT" --out "$OUT" --prompt "$PROMPT" --speed 1.1 --temperature 0.8
echo "exit $? $(date)"
