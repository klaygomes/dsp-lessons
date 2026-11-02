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
| 1 | Signals and systems | ready | round 3 fixes after viewer judge |
| 2 | Impulse response | ready | ready |
| 3 | Frequency response | ready | ready |
| 4 | Sampling and aliasing | ready | ready |
| 5 | Changing the rate | ready | ready |
| 6 | Zeros and poles | ready | ready |
| 7 | Ringing | ready | to build |
| 8 | Phase and delay | ready | to build |
| 9 | Finite precision | fixed after judge 1, judge 2 running | to build |
| 10 | FIR windows | built, learner judge running | to build |
| 11 | Bilinear transform | built, learner judge running | to build |
| 12 | DFT | built, learner judge running | to build |
| 13 | FFT | built, learner judge running | to build |
| 14 | Spectrum windows | builder running | to build |
| 15 | Hilbert | builder running | to build |
| 16 | Cepstrum | ready | to build |

## Open items

- [ ] Lesson 1 text: replace "leave a fifth of the range free" (range is -1 to +1, so that strip is a tenth) with "keep the loudest peak at 0.8, a fifth below the edge" in `1-prose.md` line 272, `1-sheet.md` lines 88 and 122, `3-page/lab.js` lines 156 and 158, then rebuild the page. Waiting on the user's go-ahead.
- [ ] Lesson 1 sheet: "behaves like linear times four while its inputs stay inside the range" should talk about outputs (an input of 0.5 is inside the range and still clips).
- [ ] Lesson 9 sheet: "within 10 to 20 ms" becomes "after 76 samples (9.5 ms) for a 0.1 click, about 20 ms for 0.001"; "mirrors" becomes "the same pushes, flipped left for right"; act 2 now uses hidden whines. Prose step five: "one arrow from every other pole to p1".
- [x] Lesson 6: decide whether to rebuild the reused `2-machine` figure with a dash-dot pole cord (dashed means input elsewhere); add "The voice meter averages how much of each tone from 300 to 3,400 Hz passes" to "Your turn".
- [ ] Lesson 10 sheet: act 2 prediction and cases changed (second bridge 3,500/4,500 Hz first, then your own line).
- [ ] Lesson 11 sheet: act 1 and act 2 designs changed (hidden aged-rack cases); add one prose sentence naming the aged rack; unify 0.707-style and %-style gains.
- [ ] Lesson 12: builder changed the mirror-arrow wording (two half arrows laid tip to tail land on the sample, not halfway between tips); check lesson 6 and series.md use the same picture. Sheet act 1 predictions changed (half turn, N = 16). Add "presses arrive at different loudness" to the act 2 task.
- [ ] Lesson 13 sheet: goertzel-final value is (-129.3, 91.8), not (-129.4, 91.0); act 1 first prediction moved inline before the odd-walk figure.
- [ ] Read-aloud long-sentence fixes for lessons 1, 2, 4 and 5 (reports in each `read-aloud-final/report.json`, ignored by git).
- [ ] Videos for lessons 2 to 16, after lesson 1's video passes so they reuse its fixes.
- [ ] Cross-lesson verification (`references/verification.md`): one mental model across prose, figures, page and video.
- [ ] Update `series.md` glossary and status as lessons pass; regenerate `index.html`.
- [ ] Push: the company proxy was unreachable on 2026-10-31, so `main` is ahead of `origin/main`.
