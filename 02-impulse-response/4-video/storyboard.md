# Storyboard: Your Own Voice, a Quarter Second Late

**Problem:** callers hear their own voice come back, faint, 0.25 s later; the box where the digital line meets the copper wire leaks part of the voice back, and nobody can open it. **Audience:** software engineers with no signal processing background who did lesson 1. **Goal:** the viewer can say why one click is enough to predict the echo of any word (each sample launches a shifted, scaled copy of h, and the copies add up: convolution), and how the canceller subtracts x * h. **Emotion:** from "you can't fix what you can't open" to the surprise that two numbers and a delay predict a word never sent, then the calm of a clean fix.

Voice: the lesson 1 narrator, reused from its saved speaker (`01-signals-and-systems/4-video/vo/voice.pt`, designed as `female, young adult, high pitch, american accent`), for series continuity. Exact command:

```bash
agent-voice script 02-impulse-response/4-video/vo.txt --out 02-impulse-response/4-video/vo --prompt 01-signals-and-systems/4-video/vo/voice.pt --speed 1.1 --temperature 0.8
```

`--speed 1.1 --temperature 0.8` is the user's choice by ear (1.3 was too fast). One non-verbal tag: `[surprise-oh]` at the reveal (line 7). No tag reaches the captions or the screen.

Visual code, the same marks as the page's figures (`2-figures/figures.mjs`, `lesson.css`): teal stems with round dots for the input (the click, the word "hi", voice x); ink stems for h and its copies; coral stems for the echo, the sum of the copies; small hollow soft circles for samples that are 0; a `//` break on the axis for the 2,000 silent samples; the box drawn in accent-soft with a coral border; accent-soft tinted columns where two copies land on one sample; dashed line for the canceller's guess; teal tick and coral cross only beside a word or number. Labels in Geist Mono at 48 px or more, quotes in Instrument Serif. Motion grammar: stems grow with a soft landing, copies slide, then drop into the sum row; held scenes drift (scale 1 to 1.03). Hard cuts between scenes. Every element sits above y = 900, clear of the caption band.

Hero frame: scene 7, the four copies of h dropping into one row and adding up to the coral echo 0.32, 0.32, −0.16, −0.20, −0.04, with the two-copy columns tinted. It lands at about 84 to 90 s, 63 to 67% of the film.

| # | Time | Purpose | Composition | Motion | Narration (line) | On-screen text | Sound | Transition | Check |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.00 to 11.73 s | hook: the bug | the loud caller's clean wave from lesson 1, then the ticket and a "hello" wave with its faint, blurred copy | wave scrolls; "hello" draws; the copy slides right | 1 | `loud caller, × 1.6`, `buzz 0%` ✓, `new ticket`, “I can hear myself.”, `hello`, `...hello` | voice | hard cut | the echo is a faint late copy of the word |
| 2 | | the gap and the cast | the same "hello" picture with a 0.25 s bracket; then the-line figure: caller, equipment, the box (accent), far person | bracket appears; a teal dot travels to the box, a coral dot comes back | 2 | `0.25 s`, `0.25 s × 8,000 per second = 2,000 samples`, `your voice`, `street corner, another city`, `echo, 2,000 samples later`, `sealed` | voice | hard cut | the echo is made in a box nobody can open |
| 3 | | what we know: LTI | the word "hi" (teal) into the box, the echo (coral) out | input and echo double, return; then both slide 2 samples later with ghosts | 3 | `input × 2`, `echo × 2`, `two inputs added: their echoes added`, `linear` ✓, `2 samples later`, `time-invariant` ✓ | voice | hard cut | the box passes both of lesson 1's tests |
| 4 | | the impulse | a word squiggle and a tone fade; one teal stem at n = 0, hollow zeros everywhere else | the stem grows; zeros appear left to right | 4 | `a word`, `a tone`, `1`, `all other samples: 0`, `the impulse, δ[n]`, n from −3 to 6 | voice | hard cut | an impulse is one sample at 1 |
| 5 | | the impulse response | click in, the box, h on a broken axis: 0.4 at 2,000, 0.2 at 2,001 | a teal dot enters the box; zeros, then the two ink stems | 5 | `click in`, `echo path`, `what comes back, h[n]`, `2,000 silent samples = 0.25 s`, `0.4`, `0.2`, `delay 2,000 · sizes 0.4, 0.2` | voice | hard cut | h is two sizes and a delay |
| 6 | | worked example: the word as clicks | "hi" = 0.8, 0.4, −0.6, −0.2; four rows below | each value lands as spoken; the four samples drop into their own rows (ghosts stay), then rise back | 6 | `“hi”`, the four values, `0.8 at n = 0`, `0.4 at n = 1`, `−0.6 at n = 2`, `−0.2 at n = 3`, `= the four rows added` | voice | hard cut | a word is four clicks |
| 7 | hero | the mechanism: copies add up | the four click rows on the left, n = 2,000 to 2,005 on the right, the sum row below | each row's copy of h appears, scales to its click, shifts by its click's n; copies drop into the sum; coral echo grows | 7 | `× click size`, `shifted with its click`, copy values, `0.32 0.32 −0.16 −0.20 −0.04`, `echo`, `5 samples, peak 0.32` | voice | hard cut | the copies add up to the echo |
| 8 | | the rule, named, and the misreading | y[n] = Σ x[k] h[n − k] with each piece glossed; x * h ≠ x[n] × h[n]; then the pointwise picture | formula builds piece by piece as spoken; product cells fill with 0 | 8 | `convolution`, `add up all the copies`, `a copy of h, k samples late`, `one input sample, its size`, `x * h`, `≠ x[n] × h[n]` ✗, `product 0 ...`, `x[n] × h[n]: no echo` ✗, `x * h`, `the real echo` | voice | hard cut | the star is not multiplication |
| 9 | | the fix | the canceller figure: equipment, the box, far person, canceller, minus sign, earpiece | voice dots run out and into the canceller; the coral echo and the dashed guess meet at the minus and vanish; the far voice goes on | 9 | `voice x`, `canceller`, `0.4 × x[n − 2000]`, `+ 0.2 × x[n − 2001]`, `guess`, `far voice + echo`, `echo − guess = 0`, `far voice only` ✓ | voice | hard cut | subtracting x * h leaves the far voice |
| 10 | | next bug | a crisp call wave that goes soft | the wave scrolls past like a live line, morphs to its smooth version on "muffled", stops 0.5 s after "wall" | 10 | `next ticket`, “Like talking through a wall.”, `nothing added` ✓, `something removed`, `next: what did the line remove?` | voice | end hold 0.6 to 1.4 s | the viewer leaves with the next bug |

## Scene timing (from `schedule.json`)

Each scene cuts in 9 frames (0.3 s) before its line's first word; scene 1 is on screen from frame 0. Pauses after each line, by meaning: 0.6, 0.8 (before the box's facts), 0.5, 0.6, 1.2 (after the question "Can two sizes and a delay really predict...?"), 0.6, 1.0 (after the reveal), 0.8, 1.2 (before the next ticket) s; lead-in 0.6 s, tail 0.5 s.

| # | Scene | Length | Purpose | Voice | Clip | Coverage |
|---|---|---|---|---|---|---|
| 1 | 0.00 to 11.73 s | 11.7 s | hook: the bug | 0.60 to 11.44 s | vo/line01.wav | 1.00 |
| 2 | 11.73 to 25.80 s | 14.1 s | the gap and the cast | 12.04 to 25.31 s | vo/line02.wav | 1.00 |
| 3 | 25.80 to 36.27 s | 10.5 s | what we know: LTI | 26.11 to 36.07 s | vo/line03.wav | 0.94 |
| 4 | 36.27 to 45.17 s | 8.9 s | the impulse | 36.57 to 44.85 s | vo/line04.wav | 1.00 |
| 5 | 45.17 to 58.70 s | 13.5 s | the impulse response | 45.45 to 57.81 s | vo/line05.wav | 0.95 |
| 6 | 58.70 to 73.10 s | 14.4 s | the word as clicks | 59.01 to 72.80 s | vo/line06.wav | 0.91 |
| 7 | 73.10 to 90.70 s | 17.6 s | copies add up (hero) | 73.40 to 90.00 s | vo/line07.wav | 0.94 |
| 8 | 90.70 to 104.77 s | 14.1 s | convolution, and the misreading | 91.00 to 104.27 s | vo/line08.wav | 0.98 |
| 9 | 104.77 to 122.43 s | 17.7 s | the fix: the canceller | 105.07 to 121.53 s | vo/line09.wav | 1.00 |
| 10 | 122.43 to 133.48 s | 11.0 s | next bug | 122.73 to 132.98 s | vo-fix/line01.wav | 0.91 |

Film 133.48 s, 481 spoken words in `vo.txt` (482 with the tag), 216 words per minute over the whole film, 231 over the 125.1 s of speech. The hero frame (scene 7, the copies dropping into the coral sum) lands at 84 to 90 s, 63 to 67% of the film.

## Voice

`agent-voice doctor`: ready, v0.2.0, mps. Then the command above, which reuses lesson 1's saved speaker at speed 1.1, temperature 0.8. Coverage per line (Whisper words heard over words written): 1.00, 1.00, 0.94, 1.00, 0.95, 0.91, 0.94, 0.98, 1.00, 0.91. Every miss is a transcription form, not a dropped word: Whisper writes "point eight" as "0 .8", "time-invariant" as "time invariant", "lesson one's" as "lesson 1's", "hi" as "high", and hears the `[surprise-oh]` as "Oh". Line 10 was re-voiced once with the same speaker, speed and temperature (`vo-fix.txt` into `vo-fix/`, log in `vo-fix-log.txt`): the first take read as "Caller stopped stammering", the second as "Caller stops stammering" (the plural s runs into "stop"); both 0.91, the second is used. `lines.final.json` maps lines 1 to 9 to `vo/` and line 10 to `vo-fix/`.

One tag, `[surprise-oh]`, at the reveal in line 7. Spoken lists of more than four numbers were kept out of the narration (lesson 1's voice model dropped them): line 7 says "five samples, starting at two thousand, peaking at point three two" and the five echo values stay on screen in coral.

Captions: `final.vtt`, 74 cues, at most two rows of at most 42 characters, built by `captions.py` from the measured word times (the `vo.txt` words aligned to Whisper's words with difflib, unmatched words interpolated between their neighbors), breaking at punctuation and never after a weak word (the, of, as, what...). Tags stripped; "hi" in quotes as on screen. `schedule.py --vtt` was not used (one cue per line breaks the 42-character rule).

## Build

`film/index.src.html` holds the film with `const SCHEDULE = /*SCHEDULE*/null;`; `python3 film/build.py` embeds `schedule.json` and writes `film/index.html`, the file the renderer reads. Runtime copied from motionmaxxing `runtime/`. Every on-screen beat is keyed to a spoken word through `word(line, form, nth)`; all 66 anchors resolve (checked against `schedule.json`).

## Gates (look.sh on final.mp4, lint.mjs on film/index.html)

- G0 PASS: duration 133.47 s matches --expect 133.48 s; audio present. H.264 1920x1080 30 fps, AAC 48 kHz.
- G2 PASS: no run of more than 3 flat frames.
- G3 PASS: end hold 0.90 s (0.6 to 1.4); final shot 0.93 s, 1% of the film.
- G1 by eye on `look/sheet.jpg` and `stills-final/sheet.png`: every label in Geist Mono at 48 px or more (0.044 H), quotes in Instrument Serif at 64 px; plots span 0.6 to 0.9 W; nothing below y = 900.
- G4 by eye: one plot, one diagram or one row of in, box, out per frame. Scene 8's pointwise frame carries a small "x * h, the real echo" inset at under a quarter of the main plot's area, as the page's pointwise figure does.
- G5 PASS, no warnings (chart axes, ticks and sample numbers are lesson content and were not flagged).
- Audio: -14.2 LUFS integrated, true peak -1.2 dBFS after AAC (mixed at `--tp -1.5`), LRA 3.5 LU. Flags kept by design: 0.77 s lead silence, the pauses between lines (reported as dropouts), 0.65 s tail under the end hold.
- MOTION note: mean frame-to-frame change 0.2/255, below the motion band. Lessons hold charts while the voice explains; held scenes drift (scale 1 to 1.03, the hero 1.04). The first render failed G0 with "NO MOTION" (165 of 4,003 frames changed at look.py's 96x54 analysis size, where drift does not register) and G3 with a 2.00 s end hold. Fixed with meaning: scene 10's call wave now scrolls past like a live line (as lesson 1's first and last scenes do), goes soft on "muffled", stops 0.5 s after "wall", and the last label lands on "what?".

## Motion and sound notes

Stems grow with `softLand`; copies slide by whole sample widths; the four copies drop into the sum row staggered by 5 frames; values land 2 frames before their spoken word. No music or SFX (no offline generator). Intended tempo if added later: 90 BPM, 20 frames per beat, ducked 9 dB under the voice, cleared for 0.3 s before the sum lands in scene 7.

## Departures from the prose and the page

- Narration is cut from the prose's story arc (bug, LTI, impulse, h, "hi" as clicks, copies, convolution, the misreading, the canceller, next bug). Left on the page: the 0.1 click and dividing by it, measuring in a quiet moment, the smoother and the booster counter-case, the derivation chain, x * h = h * x, the flip-and-slide column view, and the delay-error study.
- New bridge phrases, not in the prose: "Far down your line" (for the cast), "Two sizes and a delay" (the prose says "two numbers and a delay"), "One click just predicted the echo of a word you never sent" (the prose: "Two numbers and a delay, measured with one click, predicted the echo of a word you never sent").
- Scene 3 draws the box's LTI behaviour with "hi" and its echo at the same scale and with no 2,000-sample gap, to show doubling and delaying only; the gap appears in scene 5.
- Scene 6 labels the click rows "0.8 at n = 0" and so on (the page's word-as-clicks figure writes 0.8 δ[n]); the film never voices δ beyond naming the impulse, and the page's copies figure uses the "at n =" wording.
- Scene 7 draws the copies and the sum at the same scale (the page's copies figure draws copies 2x taller than the clicks and says so; the film draws clicks smaller on the left instead).
- The spoken "every other sample at zero" comes from the prose; the on-screen label says "all other samples: 0" so it cannot be read as alternating.

## Viewer judge

Round 1 (fresh agent; contact sheet, narration, captions, teacher's sheet): "ready", with fixes. Understood the main idea and the canceller. Flags and changes:
- δ[n − k] row labels in scene 6 never voiced: rows now read "0.8 at n = 0" and so on.
- Scene 3's echo drawn as tall as the doubled input: now drawn at the input's scale.
- "Echo path" spoken but the picture says only "the box": scene 5 labels the box "echo path", as the page figure does.
- Six caption cues split a phrase ("the / box", "as / many", "the far / voice"...), and "hi" lacked quotes: the caption builder never breaks after a weak word, and quotes "hi".
- Two flags came from frames the sheet happened to sample (scene 2's "echo, 2,000 samples later" and scene 8's "x * h" are on screen while spoken); no change.

Round 2 (a new fresh agent, final stills sheet): "ready". No number disagrees. Non-blocking notes: "every other sample" can read as alternating (label changed to "all other samples: 0"; the spoken line kept from the prose); two caption breaks (cue breaks now prefer punctuation; "The echo is gone, and the far voice / comes through at full size." stays because the comma break gives a 45-character row); the far voice and "stammering" are carried by the pictures and the prose only, kept as is; "nothing was invented" is a teaser for lesson 3.
