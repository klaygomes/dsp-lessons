# Tasks

Where the course build stands, so work can resume in a new session. Built with the `klay-learning-ladder` skill (dotfiles `claude/skills/klay-learning-ladder/`). Pages ship as files in this repo; never publish them as Artifacts.

## How each lesson is finished

1. Builder: figures (`2-figures/`) and page (`3-page/`) from `1-prose.md` and `1-sheet.md`, using `_kit/`.
2. Learner judge (fresh agent, own Chrome on a random port): walks the page, reports blocking items.
3. Fix, then judge again until "ready". Mark `page ready` in `series.md`, run `python3 _kit/index.py`.
4. Video (`4-video/`): narration voiced with agent-voice v0.2.0 (young female voice, `--speed 1.1 --temperature 0.8`), motionmaxxing film, gates G0 to G5, then a viewer judge until "ready". Mark `video ready`.

Rules the builders learned the hard way (they live in the builder brief):

- A prediction never asks for a number the text above it already prints, and options carry no built-in reasons.
- Act 2 uses live values the prose never prints; default settings must not pass; feedback names the mistake without giving the answer.
- No sideways scroll at 400 px; figures readable in grayscale (shape and line style, not only color).
- Videos: keep speed 1.1 (the user's choice by ear on 2026-11-02; 1.3 was too fast), say less rather than slower (about 450 to 480 words; at 1.1 the film runs about 15% longer than at 1.3); captions at most 42 characters per line; text clear of the caption band; no voice tags in captions.

## Status

| # | Lesson | Page | Video |
|---|---|---|---|
| 1 | Signals and systems | ready | ready (viewer judge ready with polish, polish applied 2026-11-05; hero frame at 46 to 54%, laugh tag faint) |
| 2 | Impulse response | ready | ready |
| 3 | Frequency response | ready | ready |
| 4 | Sampling and aliasing | ready | ready |
| 5 | Changing the rate | ready | ready |
| 6 | Zeros and poles | ready | ready |
| 7 | Ringing | ready | ready |
| 8 | Phase and delay | ready | ready |
| 9 | Finite precision | ready (judge 3 ready with polish, polish applied 2026-11-05) | to build |
| 10 | FIR windows | ready (judge 5: one answer leak, fixed and checked in a browser 2026-11-05) | to build |
| 11 | Bilinear transform | ready (judge 2 ready with polish, polish applied 2026-11-05) | to build |
| 12 | DFT | ready (judge 2 ready with polish, polish applied 2026-11-05) | to build |
| 13 | FFT | ready (judge 2 ready with polish, polish applied 2026-11-05) | to build |
| 14 | Spectrum windows | ready (judge 2 ready with polish, polish applied 2026-11-05) | to build |
| 15 | Hilbert | ready (judge 2 ready with polish, polish applied 2026-11-05) | to build |
| 16 | Cepstrum | ready | ready (viewer judge ready with polish, polish applied 2026-11-05) |

## Open items

- [x] Lesson 1 text: replace "leave a fifth of the range free" (range is -1 to +1, so that strip is a tenth) with "keep the loudest peak at 0.8, a fifth below the edge" in `1-prose.md` line 272, `1-sheet.md` lines 88 and 122, `3-page/lab.js` lines 156 and 158, then rebuild the page. Done 2026-11-05.
- [x] Lesson 1 sheet: "behaves like linear times four while its inputs stay inside the range" should talk about outputs (an input of 0.5 is inside the range and still clips). Done in sheet and prose ("outputs"), 2026-11-05; the video narration follows.
- [x] Lesson 9 sheet: "within 10 to 20 ms" becomes "after 76 samples (9.5 ms) for a 0.1 click, about 20 ms for 0.001"; "mirrors" becomes "the same pushes, flipped left for right"; act 2 now uses hidden whines. Prose step five: "one arrow from every other pole to p1".
- [x] Lesson 6: decide whether to rebuild the reused `2-machine` figure with a dash-dot pole cord (dashed means input elsewhere); add "The voice meter averages how much of each tone from 300 to 3,400 Hz passes" to "Your turn".
- [x] Lesson 10 sheet: act 2 prediction and cases changed (second bridge 3,500/4,500 Hz first, then your own line).
- [x] Lesson 11 sheet: act 1 and act 2 designs changed (hidden aged-rack cases); add one prose sentence naming the aged rack; unify 0.707-style and %-style gains.
- [x] Lesson 9 page, learner judge 2 said "not ready" (2026-11-02), after the round 1 fixes:
  - act 1's prediction "At which step do the poles first land past the rim, so the notch goes unstable?" marks 1/2 wrong ("on it, not past it"), but the lab draws "on or past the rim" in one red marker and the page later calls a pole on the circle "a ring that never dies"; drop "so the notch goes unstable" or accept 1/2 with the nuance;
  - hidden act 1 copies of act 2's controls (`lab-centre` slider, "100 Hz wide") throw `TypeError ... reading 'whines'` in `spectrumOf`; remove them;
  - the "Show the answer" toggle above lab 1 turns into "Show the working", shows a one-line "(Spoiler, for readers without the lab...)" and cannot close;
  - the "About 0.03" hint says "these six poles sit 4.5° apart": only neighbours in each half are;
  - at 500px the first recurrence `<pre>` hides `output[n - 6]` off its right edge; wrap it;
  - "0.9418 × 2.9754 = 2.8021" should be 2.8022 (exact 2.8023; 0.9802³ = 0.94182, not 0.94177) in prose, sheet and page; the chip result is unchanged.
- [x] Lesson 10 page, learner judge 2 said "not ready" (2026-11-02), after the round 1 fixes:
  - "A window with soft edges" gives act 2's answer for your own line ("at 41 it scrapes through with 0.93%, at 45 there's room to spare"); lock it with `working`, or make your own line's case differ from the prose's;
  - act 1's ghost strip thins to grey dashes at 191 to 255 coefficients, which reads as "length fixes it" against the readout's "still 1.090", and the dashes look like the figure's "where the ghost would sit" guide;
  - act 2 is binary (rectangle never passes, so the task is "click Hamming, find the shortest length"); the sheet planned a different prediction (Hamming against the plain cut at 4,300 Hz); bring the sheet and page together;
  - the dB view's -40 dB line starts at 4,000 Hz instead of the remove edge;
  - terms before their definition: "voice band" in the subtitle, "Hamming window's response" in the rectangle figure, "taper" never defined, "mirror arrows" leans on lesson 6, act 1's "Filter on" unexplained; the status line never says the sweep loops.
- [x] Lesson 11 page, learner judge 1 said "ready" (2026-11-02) with polish:
  - act 2 says "much higher" even when 35 Hz short; show it only when far below;
  - "What people get wrong" echo caption says it "flips sign every sample", but the stems run 0.7157, 0.4660, -0.2807, so it flips from n = 1 on;
  - typing the prose's 10,607 Hz in act 2 gets a generic "too high"; say it is the 3,400 Hz answer and this exchange needs the same backward calculation;
  - act 1's "same gain as" label is clipped at the right edge at the 100,000 Hz preset;
  - the slider cannot land on 3,400 Hz (706 gives 3,387, 707 gives 3,427);
  - Reset after Pin leaves the stale pin text in the live region;
  - the sheet's act 2 still plans the fixed 3,400 Hz case, and it says "cutoff" was defined in lesson 4 in one place and lesson 10 in another.
- [x] Lesson 12 page, learner judge 1 said "ready" (2026-11-02) with polish:
  - the 2,500 Hz prediction's caption ("its match spreads over its neighbors") is visible while the question is open; show it after the answer;
  - act 2 draws press strength at random (0.55 to 1.0, `lab.js` line 76), so winning bins score 46% to 72% while the prose says at least 86%; say presses arrive at different strengths (same as the item below);
  - 0 Hz starting a quarter turn behind says "both halves pile up" next to a match of 0.00; say the samples are all zero;
  - the phase label "345° behind the right, clockwise" should read "15° above the right";
  - guard against four identical digits in a call;
  - the lab names whole-turn wheels and leakage before "Which test wheels?" introduces them; "alias" has no gloss;
  - the sentence before the first prediction says the products "cancel", which gives the answer away.
- [x] Lesson 12: builder changed the mirror-arrow wording (two half arrows laid tip to tail land on the sample, not halfway between tips); check lesson 6 and series.md use the same picture (checked 2026-11-05: same picture, wording only). Sheet act 1 predictions changed (half turn, N = 16). Add "presses arrive at different loudness" to the act 2 task.
- [x] Lesson 13 sheet: goertzel-final value: recomputed as (-129.3, 91.0); 91.8 is the result's length, printed separately; act 1 first prediction moved inline before the odd-walk figure.
- [ ] Read-aloud long-sentence fixes for lessons 1, 2, 4 and 5 (reports in each `read-aloud-final/report.json`, ignored by git).
- [ ] Videos for lessons 2 to 16, after lesson 1's video passes so they reuse its fixes.
- [ ] Cross-lesson verification (`references/verification.md`): one mental model across prose, figures, page and video.
- [ ] Update `series.md` glossary and status as lessons pass; regenerate `index.html`.
- [x] Push: `main` matches `origin/main` (checked 2026-11-05).
