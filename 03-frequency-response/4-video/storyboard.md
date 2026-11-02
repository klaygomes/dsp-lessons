# Storyboard: The Wall on the Line

**Problem:** calls on the new east route sound muffled, as if through a wall; nothing drops, nothing buzzes, every word arrives, but the edges of consonants are gone. **Audience:** software engineers with no signal processing background who did lessons 1 and 2. **Goal:** the viewer can say why a linear, time-invariant line hands every tone back as the same tone (copies of a turning wheel turn together), what gain and phase are, that the frequency response is both for every tone, and why the fix is a boost of one over the gain per band, not a volume knob. **Emotion:** from "the click's three numbers say nothing about muffled" to the surprise that a falling curve is the wall, then the calm of a voice that steps back out.

Voice: the lesson 1 narrator, reused from its saved speaker (`01-signals-and-systems/4-video/vo/voice.pt`, designed as `female, young adult, high pitch, american accent`), for series continuity. Exact command:

```bash
agent-voice script 03-frequency-response/4-video/vo.txt --out 03-frequency-response/4-video/vo --prompt 01-signals-and-systems/4-video/vo/voice.pt --speed 1.1 --temperature 0.8
```

`--speed 1.1 --temperature 0.8` is the user's choice by ear (1.3 was too fast). Two non-verbal tags: `[surprise-oh]` at the reveal ("And there's the wall", line 7) and `[sigh]` before the next bug's question (line 10). No tag reaches the captions or the screen.

Visual code, the same marks as the page's figures (`2-figures/figures.mjs`, `lesson.css`): dashed soft stems with hollow dots for what goes into the route; solid ink stems with filled dots for what comes out; small soft dots for samples that are 0; the wheel as an ink circle with soft stop dots, a coral dot on a dashed spoke, and a strip of horizontal stems below it (time runs down, left-right position is the sample); the phase wheel with the input on a dashed circle of size 1 and the output on a solid circle of 0.70, the gap shaded accent-soft with a coral edge; copies as thin ink arrows tip to tail, their sum a coral arrow; the gain curve in ink with the vowel region in paper-2 and the consonant edges in accent-soft, "s" marked in coral at 49%; the boost in teal (the page's boost color) as one level per band over paper-2 band shading; the line's range as a paper-2 band, a clipped sample as a coral stem with a cut tick. Teal tick and coral cross only beside a word. Labels in Geist Mono at 48 px or more, the ticket quote in Instrument Serif. Motion grammar: stems grow with a soft landing, wheels step one sample at a time, curves reveal left to right as the tone sweeps; held scenes drift (scale 1 to 1.03, the hero 1.04). Hard cuts between scenes. Every element sits above y = 900, clear of the caption band.

Hero frame: scene 7, the frequency response: the gain curve drawn by a coral marker sweeping 0 to 4,000 Hz, with 100%, 70% and 40% landing as spoken, the phase line under it, then the wall: the consonant band shaded where the curve is lowest and "s": 49%. It lands at about 79 to 96 s, 58 to 70% of the film.

| # | Time | Purpose | Composition | Motion | Narration (line) | On-screen text | Sound | Transition | Check |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.00 to 12.00 s | hook: the bug | a call wave across the frame (lesson 2's last picture), the route named above it | the wave scrolls like a live line; on "edges" it goes soft | 1 | `the east route`, `old cable, smoothing circuit`, `no drops` ✓, `no buzz` ✓, “Like talking through a wall.”, `every word: there`, `edges: gone` | voice | hard cut | the voice is all there, its edges are gone |
| 2 | 12.00 to 26.03 s | what we know: the click test | the click figure: a dashed click of 1 at n = 0, the east route box, three ink stems out | the click grows, a soft dot runs through the box, the stems land on each spoken value | 2 | `linear` ✓, `time-invariant` ✓, `the click going in`, `1`, `what comes back`, `0.15`, `0.70`, `0.15`, `where is “muffled”?` | voice | hard cut | h is 0.15, 0.70, 0.15 and says nothing about muffled |
| 3 | 26.03 to 38.10 s | worked example 1 | the tone-in-out figure: 2,000 Hz in (dashed) and route out (ink) on one axis, n = 0 to 7 | input stems land on "one, zero, minus one, zero"; output stems grow on "same pattern"; the 70% bracket and the one-sample arrow land on their words | 3 | `2,000 Hz`, `8,000 ÷ 2,000 = 4 samples per cycle`, `in`, `out` (key at the right edge), `70%`, `1 sample later`, `2,000 Hz in, 2,000 Hz out` ✓ | voice | hard cut | same tone, 70%, one sample late |
| 4 | 38.10 to 51.83 s | the tone as a wheel | the wheel figure, three cells: 1,000, 2,000 and 4,000 Hz, each wheel over its sample strip | the 2,000 Hz dot steps 90° per sample and each row drops; the 1,000 Hz cell steps 45°, the 4,000 Hz cell flips | 4 | `2,000 Hz 90°`, `1,000 Hz 45°`, `4,000 Hz 180°`, `−1`, `+1`, `n = 0`, `7`, `the tone as a wheel` | voice | hard cut | a tone is a dot turning a fixed angle per sample |
| 5 | 51.83 to 62.53 s | gain and phase | the phase figure: in on the dashed circle of size 1, out on the solid circle of 0.70, the 90° gap shaded | both dots step 90° per sample together, the gap constant | 5 | `2,000 Hz, through the route`, `in: size 1`, `out: size 0.70`, `gain = 0.70 ÷ 1 = 0.70`, `phase = 90°`, `90°`, `one sample behind` | voice | hard cut | gain is the size ratio, phase the angle behind |
| 6 | 62.53 to 77.93 s | the mechanism: copies turn together | the arrows-turning figure: fresh, one-old and two-old dots at 1,000 Hz on the left; the same copies as arrows 0.15, 0.70, 0.15 tip to tail with the coral sum 0.912 on the right | dots land on their words, arrows draw one by one; then wheel and chain step 45° twice together over a faint ghost of the start | 6 | `1,000 Hz: three copies`, `fresh`, `1 old`, `2 old`, `45°`, `1,000 Hz: the same copies as arrows`, `0.15`, `0.70`, `sum 0.912` (names and weights follow the turned chain), `all turn together`, `sum: same speed, same tone` ✓ | voice | hard cut | the sum turns at the tone's speed, so no new tone |
| 7 | hero | the frequency response, and the wall | the response figure: gain 100% to 40% over 0 to 4,000 Hz, the phase line under it | a coral marker sweeps and draws both curves; 100%, 70%, 40% land as spoken; the consonant band and the vowel region shade in on their words | 7 | `gain: how much of each tone the route keeps`, `70%`, `40%`, a dashed coral 50% line on "half", `phase: 0° to 180°, 45° per 1,000 Hz`, `the frequency response`, `vowels`, `consonant edges`, `“s”: 49%` | voice | hard cut | high tones lose half or more: the wall |
| 8 | 96.63 to 109.53 s | the misreading: the volume knob | the voice's two parts after the route (500 Hz vowel 0.977, 3,000 Hz edge 0.488) doubling to 1.95 and 0.98, the old heights left as dashed lines; then the two-tone caller through the route at × 2 against the line's range | bars grow on "doubling"; the ratio lands on "half"; cut to the caller's samples, n = 8 asks −1.25 and is cut to −1 | 8 | `a voice: equal parts going in, after the route`, `volume × 1: 0.488 ÷ 0.977 = 0.50`, `after the route, volume × 2`, `1.95`, `0.98`, `0.98 ÷ 1.95 = 0.50: still half`, `a loud caller’s samples, through the route, × 2`, `the line’s range, −1 to 1`, `asks −1.25, cut to −1`, `clipped: lesson 1’s buzz`, ✗ `one knob: × 2 for every tone` | voice | hard cut | a knob keeps the slope and clips |
| 9 | 109.53 to 125.00 s | the fix | the cascade and bands figures in one plot: the route's gain, a teal boost arrow at 2,000 Hz, then seven bands with their teal boost levels, then ink dots at 100% | 70% lands, the teal arrow rises on "boost", band levels land left to right, the 100% dots land on "full strength"; cut to the call wave going crisp again | 9 | `70%`, `boost: 1 ÷ 0.70 = × 1.43`, `× boost, one knob per band`, `1.02` to `2.31`, `the route`, `route × boost = 100% in every band` ✓, `together`, `every word, edges back` | voice | hard cut | one over the gain, per band, flattens the wall |
| 10 | 125.00 to 137.10 s | next bug | the wheel with the stops 0 to 4,000 Hz on its top half, the ticket on the right | stops land on "wheel", the dot steps round to 4,000 Hz; a dashed coral arc goes past half a turn to 225° on "more"; the last label lands on "sample?" | 10 | `next ticket: a hearing clinic`, `plays 5,000 Hz`, `patients hear 3,000 Hz`, `0` to `4,000`, `5,000 Hz: 225°?` | voice | end hold 0.6 to 1.4 s | the viewer leaves with the next bug |

## Scene timing (from `schedule.json`)

Each scene cuts in 9 frames (0.3 s) before its line's first word; scene 1 is on screen from frame 0. Pauses after each line, by meaning: 0.8, 1.0 (after "We need a different question"), 0.6, 0.5, 0.8, 1.0 (before the sweep), 1.2 (after the reveal), 0.6, 1.2 (before the next ticket) s; lead-in 0.6 s, tail 0.5 s.

| # | Scene | Length | Purpose | Voice | Clip | Coverage |
|---|---|---|---|---|---|---|
| 1 | 0.00 to 12.00 s | 12.0 s | hook: the bug | 0.60 to 11.50 s | vo/line01.wav | 1.00 |
| 2 | 12.00 to 26.03 s | 14.0 s | the click test | 12.30 to 25.32 s | vo-fix/line01.wav | 0.87 |
| 3 | 26.03 to 38.10 s | 12.1 s | one tone in, same tone out | 26.32 to 37.80 s | vo/line03.wav | 0.94 |
| 4 | 38.10 to 51.83 s | 13.7 s | the tone as a wheel | 38.40 to 51.63 s | vo/line04.wav | 0.96 |
| 5 | 51.83 to 62.53 s | 10.7 s | gain and phase | 52.13 to 62.03 s | vo-fix/line02.wav | 0.92 |
| 6 | 62.53 to 77.93 s | 15.4 s | copies turn together | 62.83 to 77.23 s | vo/line06.wav | 0.98 |
| 7 | 77.93 to 96.63 s | 18.7 s | frequency response (hero) | 78.23 to 95.73 s | vo/line07.wav | 0.91 |
| 8 | 96.63 to 109.53 s | 12.9 s | the volume knob | 96.93 to 109.24 s | vo/line08.wav | 1.00 |
| 9 | 109.53 to 125.00 s | 15.5 s | the fix: boost per band | 109.84 to 124.10 s | vo-fix2-t1/line01.wav | 0.94 |
| 10 | 125.00 to 137.10 s | 12.1 s | next bug | 125.30 to 136.60 s | vo/line10.wav | 0.97 |

Film 137.10 s, 481 spoken words in `vo.txt` (483 with the tags), 211 words per minute over the whole film, 225 over the 128.3 s of speech. The hero frame lands at 79 to 96 s, 58 to 70% of the film.

## Voice

`agent-voice doctor`: ready, v0.2.0, mps. Then the command above. Coverage per line (Whisper words heard over words written): 1.00, 0.87, 0.94, 0.96, 0.92, 0.98, 0.91, 1.00, 0.94, 0.97. Re-voiced lines, same speaker, speed and temperature:

- Lines 2 and 5 (`vo-fix.txt` into `vo-fix/`, log `vo-fix-log.txt`). Line 2's first take scored 0.87 and the retake 0.87 too: every miss is a transcription form ("point one five" as ".15", "route" as "root", "time-invariant" as "time -invariant"), no dropped word. Line 5's first take read "is its gain? Here 0.7", a question rise; the line now ends each definition with a period ("is its gain. Here, point seven.") and the retake reads as a statement.
- Line 9 (`vo-fix2.txt` into `vo-fix2-t1/` and `vo-fix2-t2/`): the first take and the second retake dropped "percent" ("keeps 70 of 2000 hertz"); the first retake (`vo-fix2-t1`, 0.94) says it and is used.

`lines.final.json` maps lines 2 and 5 to `vo-fix/`, line 9 to `vo-fix2-t1/`, the rest to `vo/`. The other misses are transcription forms: numbers as digits, "Hz" for "hertz", "root" for "route" (an American reading of the word), `[surprise-oh]` heard as "Oh", "wheels" for "wheel stopped".

Captions: `final.vtt`, 75 cues, at most two rows of at most 42 characters, built by `captions.py` from the measured word times (the `vo.txt` words aligned to Whisper's words with difflib after spelling Whisper's digits back out as words, unmatched words interpolated between their neighbors), breaking at punctuation and never after a weak word. Tags stripped. 3 of 483 words needed interpolation. Weak words (never ending a row) were extended after the first viewer judge with "those", "how", "from", "comes", "seventy", "neighboring", "is", "left", "trails".

## Build

`film/index.src.html` holds the film with `const SCHEDULE = /*SCHEDULE*/null;`; `python3 film/build.py` embeds `schedule.json` and writes `film/index.html`, the file the renderer reads. Runtime copied from motionmaxxing `runtime/`. Every on-screen beat is keyed to a spoken word through `word(line, form, nth)`; all 77 anchors resolve (checked against `schedule.json`).

## Gates (look.sh on final.mp4, lint.mjs on film/index.html)

- G0 PASS: duration 137.10 s matches --expect 137.10 s; audio present. H.264 1920x1080 30 fps, AAC 48 kHz.
- G2 PASS: no run of more than 3 flat frames.
- G3 PASS: end hold 1.07 s (0.6 to 1.4); final shot 1.10 s, 1% of the film.
- G1 by eye on `look/sheet.jpg` and `stills-final2/sheet.png`: every label in Geist Mono at 48 px or more (0.044 H), the quote in Instrument Serif at 64 px; plots span 0.55 to 0.75 W; nothing below y = 900.
- G4 by eye: one plot, one row of wheels or one wheel with its key per frame. Scene 6 holds the wheel and the arrow chain side by side, as the page's arrows-turning figure does; they are one object (the same three copies drawn two ways) and turn together.
- G5 PASS after one fix: the first lint flagged C6 twice, two small panel names on one top row ("the click going in ... what comes back" in scene 2, "1,000 Hz: three copies ... as arrows, tip to tail" in scene 6). Scene 2's names now sit by their plots at different heights; scene 6 uses one centered name that changes when the arrows appear. Chart axes, ticks and sample numbers are lesson content and were not flagged.
- Audio: -14.2 LUFS integrated, true peak -1.5 dBFS, LRA 4.0 LU (mixed at `--tp -1.5`). Flags kept by design: 0.80 s lead silence, the pauses between lines (reported as dropouts), 0.61 s tail under the end hold.
- MOTION note: mean frame-to-frame change 0.3/255, below the motion band, as in lesson 2 (0.2). Lessons hold charts while the voice explains; held scenes drift, wheels step, curves reveal, and the first and ninth scenes scroll a live call wave. G0 passed on the first full render (the motion lesson from lesson 2 was built in).

## Motion and sound notes

Stems grow with `softLand` in 10 frames; wheels step one sample at a time (6 to 12 frames per step, `softInOut`); the response curve and phase line reveal with `cruise` while a coral marker rides the curve; values land 2 frames before their spoken word. No music or SFX (no offline generator). Intended tempo if added later: 90 BPM, ducked 9 dB under the voice, cleared for 0.3 s before the wall lands in scene 7.

## Departures from the prose and the page

- Narration is cut from the prose's story arc (bug, click test, one tone, the wheel, gain and phase, arrows turning together, the frequency response, the volume knob, the band boost, next bug). Left on the page: the convolution formula and sliding window, the 0 Hz check, the same-delay figure, worked example 2 (500 Hz plus 3,000 Hz, parts adding up to the click rule), the derivation (A, B, G, φ, the end-point figure and the arrow strip), H(e^{jω}), the misconception's tone-bars figure, the boost's honest cost and headroom, and the west route lab.
- New bridge phrases, not in the prose: "Every word is there, but its edges are gone" (prose: "The voice is all there, every word, but its edges are gone"), "No new tone can appear" (prose: "copies of a turning wheel turn together"), "Gain and phase, for every tone: that's the frequency response" (prose: "for every tone, how much the system scales it and how far it delays it"), "The caller steps out from behind the wall" (from "Your turn").
- Scene 1 uses the call wave that ended lesson 2's film, going soft, instead of a page figure (the page has no figure for the bug).
- Scene 4 shows three of the wheel figure's five cells (1,000, 2,000, 4,000 Hz), the three the narration names, with numbered stops dropped for legibility at film scale.
- Scene 6 steps the turn twice (90°) where the page's figure turns continuously and shows one 45° ghost; the label says "all turn together" rather than a number.
- Scene 8 shows the recipe bars and the clip plot one after the other; the page's volume figure puts them side by side. The bars start at the route's 0.977 and 0.488 (the page's dropped recipe figure) before doubling.
- Scene 9 merges the cascade and bands figures: the route's curve, one teal boost level per band (the bands figure's × values) and the product as dots at 100% at each band's middle, which is what the bands table's "together 100%" means; the page's cascade figure draws an exact 1 ÷ gain curve instead.
- Scene 10 adds the 225° arc (a 5,000 Hz dot's turn per sample) as the next bug's picture; the prose only asks the question.

## Viewer judge

Round 1 (fresh agent; contact sheet `stills-final/sheet.png`, narration, captions, teacher's sheet): "not ready". Understood the bug, the wheel, gain and phase, copies turning together, the frequency response, the knob and the band boost. Blocking flags and changes:
- Consonant band against "less than half": the 70% label was the loudest number in the shaded band and "s": 49% landed only on "three thousand". Now 49% lands on "consonants" and a dashed coral 50% line lands on "half"; the duplicate "100%" label inside the plot is gone.
- Volume scene: 1.95 and 0.98 were orphan numbers and "still half" had no before-state. The bars are now named "500 Hz vowel" and "3,000 Hz edge" under "a voice: equal parts going in, after the route", the before ratio "volume × 1: 0.488 ÷ 0.977 = 0.50" shows until "half", and the old heights stay as dashed lines inside the doubled bars. The clip plot is named "a loud caller’s samples, through the route, × 2".
Non-blocking flags fixed: the arrows scene names 1,000 Hz in both titles, keeps the weights 0.15, 0.70, 0.15 and the fresh, 1 old, 2 old names on the turned chain, and fades the ghost to 16%; scene 3's in/out key moved off the n ticks to the right edge; scene 9 labels the 100% dots "together"; six caption breaks fixed through the weak-word list. Kept: "smeared" (the prose's word for the click; scene 6 refutes the misconception in words and picture), the vertical sample strip (the page's wheel figure draws it this way and the narration reads it), numbers as words in captions (as lesson 2, matching the voice), the arrows not computing a gain (the derivation stays on the page).

Round 2 (a new fresh agent, `stills-final2/sheet.png`): "ready", no blocking items; every number on screen matches the sheet. Fixed after it: "before:" read as "before the route", now "volume × 1:"; caption breaks "left / or right" and "trails / the input's" removed. Kept as non-blocking: "sum 0.912" is not spoken (the page ties it to the gain; the film's point is "same speed"); "every tone gets out at full strength" against dots at band centres (the prose says the same of the boost; the lab's 95 to 105% band is on the page); "“s”: 49%" kept as the page's response figure marks it; the "frequency response" title lands on the spoken word, not before it.
