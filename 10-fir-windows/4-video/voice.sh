#!/usr/bin/env bash
set -u
LOCK=/private/tmp/claude-502/-Users-cleiton-loiola-personal-dsp-lessons/911f07aa-3ba1-4325-8f81-5a4e3ec102e4/scratchpad/voice.lock
HERE=/Users/cleiton.loiola/personal/dsp-lessons/10-fir-windows/4-video
TXT="$1"; OUT="$2"
until mkdir "$LOCK" 2>/dev/null; do sleep 15; done
echo "lesson 10 $$" > "$LOCK/owner"
release() { rm -f "$LOCK/owner"; rmdir "$LOCK"; }
trap release EXIT
/Users/cleiton.loiola/.local/bin/agent-voice script "$HERE/$TXT" --out "$HERE/$OUT" --prompt /Users/cleiton.loiola/personal/dsp-lessons/01-signals-and-systems/4-video/vo/voice.pt --speed 1.1 --temperature 0.8
