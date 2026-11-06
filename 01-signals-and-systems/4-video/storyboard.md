# Storyboard: The Buzz on Loud Calls

**Problem:** loud callers come out with a harsh buzz, quiet callers are fine, on a line that runs the same code for everybody. **Audience:** software engineers with no signal processing background, at the start of the series. **Goal:** the viewer can say why clipping invents a tone that a linear, time-invariant system never could, and how to size the booster with headroom (×1.6). **Emotion:** from puzzlement ("louder should just be louder") to the click of seeing the buzz as a second tone, then the calm of a clean fix.

Voice: `female, young adult, high pitch, american accent`, designed once by `agent-voice script` (it speaks the first sentence as a neutral reference, then clones that speaker for every line, and retries a line up to three times when Whisper hears under 90% of its words). `--speed 1.1 --temperature 0.8` (the user's choice by ear on 2026-11-02; 1.3 was too fast). Two non-verbal tags: `[laughter]` after the kazoo ticket, `[surprise-oh]` at the reveal.

Visual code, from `lesson.css` and the kit (`_kit/README.md`): paper ground, ink stems with round dots for the signal as it is; teal-soft band with dashed teal edges for the range −1 to +1 the chip can store; dashed soft hollow stems for "what ×4 asked for"; coral (accent) for the one result to notice: the clipped sample, the buzz tone. Teal tick and coral cross only with a number beside them. Labels in Geist Mono at 48 px or more, quotes in Instrument Serif. Motion grammar: stems grow with a soft landing, clipping is a hard push back to the edge, curves draw left to right, held scenes drift (scale 1 to 1.03). Hard cuts between scenes.

Hero frame: scene 7, the 1,000 Hz wave minus the small 3,000 Hz wave landing exactly on the eight clipped stems. Every element sits above y = 900, clear of the caption band.

| # | Time | Purpose | Composition | Motion | Narration (line) | On-screen text | Sound | Transition | Check |
|---|---|---|---|---|---|---|---|---|---|
| 1 | see below | hook: the bug | a quiet call's wave, small and smooth, between faint `+1` and `−1` dashed lines; the camera slides down to a loud call's wave, its tops cut flat in coral | waves scroll left; camera pans from quiet to loud | 1 | `quiet caller`, `loud caller`, faint `+1`, `−1`, the two quotes from the tickets | voice | hard cut | the buzz lives only on the loud call |
| 2 | | familiar situation: a call is numbers | the smooth voltage, sticks every 1/8,000 s, the curve fades to dots, numbers under the dots | sticks sweep left to right; curve fades | 2 | `8,000 per second`, `one sample`, the values spaced apart | voice | hard cut | samples are dots on a smooth wave |
| 3 | | the tone | nine stems of cos(45° n) with their angles | stems drop in one per step | 3 | `1,000 Hz`, `45° per sample`, angles, values | voice | hard cut | a tone is a list of cosine values |
| 4 | | the booster, the range, the edge | the code line, then the band from −1 to +1 and one stem asked to reach 2 | stem grows to 2, is pushed back to 1 in coral | 4 | `output[n] = 4 * input[n]`, `n: the sample number`, `the range: what the chip can store`, `the edge`, `2.0 → 1.0`, `clipping` | voice, 1.8 s hold after "That's clipping." | hard cut | the chip flattens anything past the edge |
| 5 | | worked example 1 | the quiet and the loud caller side by side, same scale, each in its band | quiet grows ×4 to 0.80; loud grows to 2.00, then flattens | 5 | `quiet caller: 0.2 × 4`, `peak 0.80` ✓, `loud caller: 0.5 × 4`, `1, 1, 0, −1, −1, −1, 0, 1` | voice | hard cut | only the loud one clips |
| 6 | | the neighbor rule | three stems; the two outer stacked beside the middle one × 1.414 | the clean tone matches, then the clipped list fails in place | 6 | `the neighbor rule`, `1.00 + 0.00 = 1.00`, `1.414 × 0.71 = 1.00` ✓; `1 + 0 = 1`, `1.414 × 1 = 1.414` ✗ | voice, 2.0 s hold after "The clipped one fails." | hard cut | the clipped list is not a pure tone |
| 7 | hero | reveal: two tones | the eight clipped stems; the 1,000 Hz wave (size 1.207, dashed) and the 3,000 Hz wave (size 0.207, coral) | the difference curve bends from the big wave onto every stem | 7 | `1,000 Hz, size 1.207`, `3,000 Hz, size 0.207: the buzz` | voice | hard cut | the buzz is a tone nobody said |
| 8 | | linear, and what the booster breaks | one sample 0.2 becomes 0.8 inside the band; doubled to 0.4, linear asks 1.6, the chip writes 1.0 | stems grow; the doubled one is pushed back | 8 | `linear?`, `0.2 → 0.8` ✓, `0.4 → 1.6 asked`, `written: 1.0` ✗, `like × 4 only while outputs stay inside` | voice | hard cut | doubling the input did not double the output |
| 9 | | the trap: sums | two boosted voices (1,000 Hz and 500 Hz) side by side inside the band, then added | stems slide together and grow into the sum; the first two are cut flat | 9 | `each voice: peak 0.80` ✓, `added: 1.60 asked, 1.00 written` ✗ | voice | hard cut | each passes alone, the sum buzzes |
| 10 | | time-invariant, then the rule | a blip into the smoother gives two half stems; the same blip three samples later gives the same pair three samples later (same scale); then a tone into a box `the smoother / linear, time-invariant` and the same pitch out, resized and half a sample late | the blip and its output shift; the output tone draws | 10 | `time-invariant`, `the smoother: (this + previous) ÷ 2`, `3 samples later`, `both properties: same pitch, no new tones` (teal), `1,000 Hz out`, `resized and shifted` | voice, 2.0 s hold after "No new tones, ever." | hard cut | any LTI system only resizes and shifts a tone |
| 11 | | the fix | the loud caller's stems with the band; the setting steps ×4, ×2, ×1.6; then the teal headroom strip from 0.8 to 1 | stems shrink to ×2, then ×1.6, then the strip lands | 11 | `× 4 peak 2.00, clipped`, `× 2 peak 1.00, no margin`, `× 1.6 peak 0.80`, `headroom: 0.8 to 1` (teal), `0.8 ÷ 0.5 = 1.6`, `buzz meter`, `reads 0%`, `peaks: loud 0.80 · quiet 0.32 · pair 0.64` | voice, 1.0 s hold after "one point six" | hard cut | the loudest peak sits at 0.8, a fifth below the edge |
| 12 | | recap and next bug | loud, quiet and pair at ×1.6 side by side inside the band; then a "hello" wave and its faint copy a quarter second later | held summary until "ticket"; the copy slides out from the first; slow drift to the end | 12 | `every caller at × 1.6`, `buzz meter 0%`, `loud 0.80`, `quiet 0.32`, `pair 0.64`; `hello`, `0.25 s later`, `next: the echo` | voice | end hold 0.6 to 1.4 s | the viewer leaves with the next bug |

Times are filled from `vo/lines.json` and `schedule.json` once the narration exists (see the scene timing table below).

## Scene timing (from `schedule.json`)

Each scene cuts in 9 frames (0.3 s) before its line's first word. Pauses after each line, by meaning: 0.8, 0.5, 0.6, 1.8 (after "That's clipping."), 1.0 (after the first question), 2.0 (after "The clipped one fails.", before the reveal), 1.0, 0.6, 0.8, 2.0 (after "No new tones, ever."), 1.2 (before the next ticket) s; lead-in 0.6 s, tail 0.5 s. Line 11 also holds 1.0 s of silence after "one point six" inside its clip.

| # | Scene | Length | Purpose | Voice | Clip (coverage) |
|---|---|---|---|---|---|
| 1 | 0.30 to 9.01 s | 8.7 s | hook: the bug | 0.60 to 8.51 s | vo-r3/line01.wav (1.00) |
| 2 | 9.01 to 19.27 s | 10.3 s | a call is numbers | 9.31 to 19.07 s | vo-r4/line01.wav (1.00) |
| 3 | 19.27 to 30.14 s | 10.9 s | the tone | 19.57 to 29.84 s | vo-r3/line03.wav (0.97) |
| 4 | 30.14 to 42.62 s | 12.5 s | the booster, the range, the edge | 30.44 to 41.12 s | vo-r4/line02.wav (1.00) |
| 5 | 42.62 to 52.69 s | 10.1 s | worked example 1 | 42.92 to 51.99 s | vo-r4/line03.wav (0.87) |
| 6 | 52.69 to 64.01 s | 11.3 s | neighbor rule | 52.99 to 62.31 s | vo-r4/line04.wav (0.97) |
| 7 | 64.01 to 74.37 s | 10.4 s | reveal: two tones (hero) | 64.31 to 73.67 s | vo-r3/line07.wav (1.00) |
| 8 | 74.37 to 86.88 s | 12.5 s | linear? | 74.67 to 86.58 s | vo-r4/line05.wav (1.00) |
| 9 | 86.88 to 97.66 s | 10.8 s | the trap: sums | 87.18 to 97.16 s | vo-r4/line06.wav (0.93) |
| 10 | 97.66 to 111.20 s | 13.5 s | time-invariant and the rule | 97.96 to 109.50 s | vo-r4/line07.wav (0.97) |
| 11 | 111.20 to 127.84 s | 16.6 s | the fix | 111.50 to 126.94 s | vo-r4/line11-joined.wav (0.89) |
| 12 | 127.84 to 138.76 s | 10.9 s | recap and next bug | 128.14 to 138.26 s | vo-r3/line12.wav (0.97) |

Film 138.76 s, 464 words in `vo.txt` (462 spoken, plus two tags), 201 words per minute over the whole film. The hero frame (scene 7) runs from 46% to 54% of the film.

## Voice

Round 6 (speed 1.1, 2026-11-05, polish after the viewer judge said "ready with polish"): only the lines whose text changed were re-voiced, with `agent-voice script vo-r4.txt --out vo-r4 --prompt vo/voice.pt --speed 1.1 --temperature 0.8` (the same saved speaker, `female, young adult, high pitch, american accent`). `vo-r4.txt` holds lines 2, 4, 5, 6, 8, 9 and 10, plus line 11 as two parts, joined with 1.0 s of silence into `vo-r4/line11-joined.wav`. Lines 1, 3, 7 and 12 keep their round 5 clips from `vo-r3/` (text in `vo-r3.txt`). Coverage stays under 0.90 on line 5 (0.87) and line 11 (0.89): every word is spoken, Whisper writes "point two" as ".2", "caller" as "collar" and "lands" as "LANs".

Tags: `[surprise-oh]` (line 7) is performed as an "Oh," that Whisper times at 0.64 to 0.82 s; the word "surprise" is never spoken. `[laughter]` (line 1) is not read aloud either, but the clip holds only about 0.15 s of sound after "kazoo" (7.59 to 7.75 s), so the laugh is short.

Wording follows the prose and sheet: line 8 says "The real booster is not linear. It only behaves like the linear times four while its outputs stay inside the range."; line 10 says "Any system with both properties keeps a tone's pitch: it can only resize and shift it."; line 11 says "keep every output inside the range" and "keep the loudest peak at point eight, a fifth below the edge: that's headroom." Line 4 names the range and the edge, line 11 introduces the buzz meter ("counting new tones").

Earlier rounds: round 5 voiced the whole round 3 text into `vo-r3/`; round 4 voiced `vo-s110.txt` into `vo-s110/`; rounds 1 to 3 at speed 1.3 (audio in `~/personal/lessons/dsp-oppenheim/01-signals-and-systems/4-video/`). No tag reaches the captions or the screen.

Captions: `captions.py` writes `final.vtt` from the measured word times: 62 cues, at most two rows of at most 42 characters, no tags. A cue shorter than 14 characters joins the cue before it when both fit in two rows, and every cue lingers up to 0.8 s into the pause after it. Median reading speed 19.4 characters per second; 27 of 62 cues are above 20.

## Revision after the viewer judge (polish, round 6)

- Narration cut from 480 to 464 words: shorter neighbor rule and fix arithmetic ("So: times one point six."), holds after "That's clipping.", "The clipped one fails.", "No new tones, ever." and "one point six".
- "No new tones" is now the general rule for any system with both properties.
- Scene 5 shows both callers side by side at one scale.
- Scene 8 is titled "linear?".
- Scene 10 names the smoother in the time-invariance picture, at the same scale for in and out.
- Scene 11 shrinks to ×1.6 before the headroom strip lands; the headroom strip and its label, and "same pitch, no new tones", are teal.
- Scene 11's summary stays to the end of the scene, and scene 12 opens on loud 0.80, quiet 0.32 and pair 0.64 at ×1.6 inside the band until "ticket".
- Scene 2 values without commas; scene 3 and scene 7 layouts raised by 40 px; the lowest static content now ends at y = 881.
- New on-screen names: faint `+1` and `−1` in scene 1, `n: the sample number`, `the range: what the chip can store`, `the edge`.

## Gates (look.sh on final.mp4, lint.mjs on film/index.html)

- G0 PASS: duration 138.76 s matches --expect 138.76 s; audio present. H.264 1920x1080 30 fps, AAC 48 kHz.
- G2 PASS: no run of more than 3 flat frames.
- G3 PASS: end hold 1.17 s (0.6 to 1.4); final shot 1.23 s, 1% of the film.
- G1 by eye on `look/sheet.jpg` and `stills/sheet.png`: labels in Geist Mono at 48 px or more, nothing below y = 900 outside scene 1's 14-frame whip pan (checked every third frame with drift applied), no word anchor missed.
- G4 by eye: one plot or one in-box-out row per frame; scene 5 and scene 12 hold two or three small plots on one band and one scale.
- G5 PASS, no warnings.
- Audio: -14.3 LUFS integrated, true peak -1.9 dBFS after AAC (mixed at -2.0 dBTP), LRA 4.4 LU. The 0.80 s lead silence, the pauses between lines (flagged as dropouts) and the 0.64 s tail are by design. No music or SFX; intended tempo if added later: 90 BPM, 20 frames per beat, ducked under the voice.
- MOTION note: mean frame-to-frame change 0.1/255, below the motion band; the longest held stretch is scene 5 (7.4 s, stems grow and clip within it). Lessons hold charts while the voice explains; held scenes drift by scale 1 to 1.03.
