# Storyboard: The Buzz on Loud Calls

**Problem:** loud callers come out with a harsh buzz, quiet callers are fine, on a line that runs the same code for everybody. **Audience:** software engineers with no signal processing background, at the start of the series. **Goal:** the viewer can say why clipping invents a tone that a linear, time-invariant system never could, and how to size the booster with headroom (×1.6). **Emotion:** from puzzlement ("louder should just be louder") to the click of seeing the buzz as a second tone, then the calm of a clean fix.

Voice: `female, young adult, high pitch, american accent`, designed once by `agent-voice script` (it speaks the first sentence as a neutral reference, then clones that speaker for every line, and retries a line up to three times when Whisper hears under 90% of its words). `--speed 1.3 --temperature 0.8`. Three non-verbal tags: `[laughter]` after the kazoo ticket, `[surprise-oh]` at the reveal, `[sigh]` when the next ticket arrives.

Visual code, from `lesson.css` and the kit (`_kit/README.md`): paper ground, ink stems with round dots for the signal as it is; teal-soft band with dashed teal edges for the range −1 to +1 the chip can store; dashed soft hollow stems for "what ×4 asked for"; coral (accent) for the one result to notice: the clipped sample, the buzz tone. Teal tick and coral cross only with a number beside them. Labels in Geist Mono at 48 px or more, quotes in Instrument Serif. Motion grammar: stems grow with a soft landing, clipping is a hard push back to the edge, curves draw left to right, held scenes drift (scale 1 to 1.03). Hard cuts between scenes.

Hero frame: scene 7, the 1,000 Hz wave minus the small 3,000 Hz wave landing exactly on the eight clipped stems.

| # | Time | Purpose | Composition | Motion | Narration (line) | On-screen text | Sound | Transition | Check |
|---|---|---|---|---|---|---|---|---|---|
| 1 | see below | hook: the bug | a quiet call's wave, small and smooth; the camera slides down to a loud call's wave, its tops cut flat in coral | waves scroll left; camera pans from quiet to loud | 1 | `quiet caller`, `loud caller`, the two quotes from the tickets | voice | hard cut | the buzz lives only on the loud call |
| 2 | | familiar situation: a call is numbers | the smooth voltage, sticks every 1/8,000 s, the curve fades to dots, numbers under the dots | sticks sweep left to right; curve fades | 2 | `8,000 per second`, `sample`, the values | voice | hard cut | samples are dots on a smooth wave |
| 3 | | the tone | nine stems of cos(45° n) with their angles | stems drop in one per step | 3 | `1,000 Hz`, `45° per sample`, angles, values | voice | hard cut | a tone is a list of cosine values |
| 4 | | the booster and the chip | the code line, then the band from −1 to +1 and one stem asked to reach 2 | stem grows to 2, is pushed back to 1 in coral | 4 | `output[n] = 4 * input[n]`, `what the chip can store`, `2.0 → 1.0`, `clipping` | voice | hard cut | the chip flattens anything past the edge |
| 5 | | worked example 1 | the quiet caller's stems in the band; the camera pans to the loud caller's stems | quiet grows ×4 to 0.80; loud grows to 2.00, then flattens | 5 | `quiet 0.2 × 4`, `peak 0.80` ✓, `loud 0.5 × 4`, `1, 1, 0, −1, −1, −1, 0, 1` | voice | hard cut | only the loud one clips |
| 6 | | the neighbor test | three stems; the two outer stacked beside the middle one × 1.414 | the clean tone matches, then the clipped list fails in place | 6 | `1.00 + 0.00 = 1.00`, `1.414 × 0.71 = 1.00` ✓; `1 + 0 = 1`, `1.414 × 1 = 1.414` ✗ | voice | hard cut | the clipped list is not a pure tone |
| 7 | hero | reveal: two tones | the eight clipped stems; the 1,000 Hz wave (size 1.207, dashed) and the 3,000 Hz wave (size 0.207, coral) | the difference curve bends from the big wave onto every stem | 7 | `1,000 Hz, size 1.207`, `3,000 Hz, size 0.207: the buzz` | voice | hard cut | the buzz is a tone nobody said |
| 8 | | linear, and what the booster breaks | one sample 0.2 becomes 0.8 inside the band; doubled to 0.4, linear asks 1.6, the chip writes 1.0 | stems grow; the doubled one is pushed back | 8 | `0.2 → 0.8` ✓, `0.4 → 1.6?`, `written: 1.0` ✗ | voice | hard cut | doubling the input did not double the output |
| 9 | | the trap: sums | two boosted voices (1,000 Hz and 500 Hz) side by side inside the band, then added | stems slide together and grow into the sum; the first two are cut flat | 9 | `each voice: peak 0.80` ✓, `added: 1.60 asked, 1.00 written` ✗ | voice | hard cut | each passes alone, the sum buzzes |
| 10 | | time-invariant, then the law | a blip and its output, the same blip three samples later; then a tone into a box `linear, time-invariant` and the same pitch out, smaller and half a sample late | the blip shifts; the output tone draws | 10 | `3 samples later`, `linear, time-invariant`, `same pitch, 1,000 Hz` | voice | hard cut | an LTI system only scales and shifts a tone |
| 11 | | the fix | the loud caller's stems with the band; the booster setting steps ×4, ×2, ×1.6; a headroom strip appears from 0.8 to 1 | stems shrink at each setting | 11 | `× 4 peak 2.00` ✗, `× 2 peak 1.00, no margin` ✗, `× 1.6 peak 0.80` ✓, `headroom`, `buzz 0%`, `quiet 0.32`, `pair 0.64` | voice | hard cut | the loudest input lands at 0.8 |
| 12 | | recap and next bug | a "hello" wave and its faint copy a quarter second later | the copy slides out from the first; slow drift to the end | 12 | `hello`, `0.25 s later`, `next: the echo` | voice | end hold 0.6 to 1.4 s | the viewer leaves with the next bug |

Times are filled from `vo/lines.json` and `schedule.json` once the narration exists (see the scene timing table below).

## Scene timing (from `schedule.json`)

Each scene cuts in 9 frames (0.3 s) before its line's first word. Pauses after each line, by meaning: 0.8, 0.5, 0.6, 0.8, 1.0 (after the first question), 1.2 (before the reveal), 1.0, 0.6, 0.8, 1.0, 1.2 (before the next ticket) s; lead-in 0.6 s, tail 0.5 s.

| # | Scene | Length | Purpose | Voice | Clip |
|---|---|---|---|---|---|
| 1 | 0.30 to 10.83 s | 10.5 s | hook: the bug | 0.60 to 10.32 s | vo/line01.wav |
| 2 | 10.83 to 21.67 s | 10.8 s | a call is numbers | 11.12 to 21.45 s | vo/line02.wav |
| 3 | 21.67 to 36.90 s | 15.2 s | the tone | 21.95 to 36.61 s | vo-redo2/line01.wav |
| 4 | 36.90 to 51.23 s | 14.3 s | the booster, a system, and the chip | 37.21 to 50.73 s | vo-redo/line02.wav |
| 5 | 51.23 to 64.43 s | 13.2 s | worked example 1 | 51.53 to 63.75 s | vo-redo2/line02.wav |
| 6 | 64.43 to 74.13 s | 9.7 s | neighbor test | 64.75 to 73.23 s | vo/line06.wav |
| 7 | 74.13 to 85.10 s | 11.0 s | reveal: two tones (hero) | 74.43 to 84.39 s | vo/line07.wav |
| 8 | 85.10 to 96.13 s | 11.0 s | linear | 85.39 to 95.82 s | vo/line08.wav |
| 9 | 96.13 to 107.47 s | 11.3 s | the trap: sums | 96.42 to 106.96 s | vo/line09.wav |
| 10 | 107.47 to 119.40 s | 11.9 s | time-invariant and the law | 107.76 to 118.71 s | vo/line10.wav |
| 11 | 119.40 to 138.50 s | 19.1 s | the fix | 119.71 to 137.59 s | vo-redo/line04.wav |
| 12 | 138.50 to 146.11 s | 7.6 s | next bug | 138.79 to 145.61 s | vo-redo/line05.wav |

Film 146.11 s, 600 words in `vo.txt` (tags included), 246 words per minute over the whole film. The hero frame (scene 7) lands at about 82 s, 56% of the film.

## Voice

`agent-voice script vo.txt --out vo --voice "female, young adult, high pitch, american accent" --speed 1.3 --temperature 0.8` through the GPU lock wrapper, then re-voiced lines with `agent-voice script --prompt vo/voice.pt` (same speaker, speed and temperature) into `vo-redo/` and `vo-redo2/`. `lines.final.json` maps each line to its clip (table above). Coverage per line 0.83 to 1.00. Two tags stay in the voicing input: `[laughter]` (line 1) and `[surprise-oh]` (line 7); Whisper heard neither as a word. `[sigh]` in line 12 was heard as "Aye", so it was removed and the line re-voiced. No tag reaches the captions or the screen.

Captions: `final.vtt` holds 73 cues of 1.00 to 3.14 s, at most two rows of at most 7 words, timed from the measured word times (vo.txt words aligned to Whisper's words).

## Revision after the viewer judge

- Captions split into short cues; tags stripped.
- Scene 2 sample row: 8 values, 200 px apart, comma separated, true minus sign; "microphone voltage" names the curve.
- Narration: line 3 adds pitch and hertz in one clause and derives 45 degrees from 360 × 1,000 ÷ 8,000; line 4 defines a system ("a rule that takes in one signal, one list of numbers, and gives back another"); line 5 says what size means ("their biggest sample is point two"); line 11 says "keep the loudest peak at point eight, a fifth below the edge. That gap is the headroom." and introduces the buzz meter before reading it; line 12 drops the sigh.
- Line 5's spoken list "one, one, zero, minus one..." was dropped three times by the voice model at the new line length, so the narration ends at "sliced off flat" and the list stays on screen in coral.
- Scene 3: the tone curve and "a tone" from the first frame; value labels moved to a row under the plot, off the curve; the 360° stem in soft ink as the start of the next cycle; "8 samples, then it starts over".
- Scene 4: a "the booster" box between signal in and signal out, "a system: one signal in, another out", then the band.
- Scene 6: "left + right" appears with the word "neighbors".
- Scenes 8 and 9: "linear" and "linear?"; "0.4 → 1.6 asked" stays on screen.
- Scene 10: the box reads "the smoother / linear, time-invariant"; "same pitch, no new tones"; the plot and its label moved inside the safe area (right edge at 1,720 px).
- Scene 11: "buzz meter 0%: loud 0.80 · quiet 0.32 · pair 0.64", headroom label on the word "headroom".

## Gates (look.sh on final.mp4, lint.mjs on film/index.html)

- G0 PASS: duration 146.10 s matches --expect 146.11 s; audio present. H.264 1920x1080 30 fps, AAC 48 kHz.
- G2 PASS: no run of more than 3 flat frames.
- G3 PASS: end hold 1.20 s (0.6 to 1.4); final shot 1.23 s, 1% of the film.
- G1 by eye on `look/sheet.jpg`: every label in Geist Mono at 48 px or more (0.044 H), plots 0.6 to 0.8 W.
- G4 by eye: one plot or one in-box-out row per frame; scenes 1 and 5 pan between two plots on one strip.
- G5 PASS, no warnings.
- Seek self test: PASS, 24 samples, 681 elements, 0 mismatches.
- Audio: -14.2 LUFS integrated, true peak -1.1 dBFS after AAC (mixed at -1.5 dBTP; the first encode at -1.0 measured -0.9 and was flagged), LRA 4.0 LU. The lead silence (0.78 s), the pauses between lines and the 0.69 s tail are by design. No music or SFX; intended tempo if added later: 90 BPM, 20 frames per beat, ducked under the voice.
- MOTION note: mean frame-to-frame change 0.1/255, below the motion band. Lessons hold charts while the voice explains; held scenes drift by scale 1 to 1.03.
