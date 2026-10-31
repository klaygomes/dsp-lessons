# The Voice Underneath

Objective: after this, you can explain why multiplying a real call by a tone makes two copies (the mirror arrows), build the analytic signal with a Hilbert transformer, shift a call by 300 Hz with single sideband, and use arrow arithmetic to predict the ghost a short Hilbert transformer (|1 − G| over 1 + G) or a missing delay (tan of half the extra turn) leaves behind.

Bug: a newspaper's voice-disguise tip line shifts every call up 300 Hz by multiplying by a 300 Hz tone; every caller comes with a fainter ghost voice 300 Hz lower (a 1,000 Hz tone comes out as half 1,300 Hz plus half 700 Hz). The ghost (0 to 3,100 Hz) overlaps the wanted copy (600 to 3,700 Hz), so no filter can remove it afterwards.
Fix: act 2 of the lab: wire y = x[n − D] cos(ω₀n) − x̂[n] sin(ω₀n) with a windowed Hilbert transformer of 2D + 1 coefficients and the matching delay D on the plain path. 31 Hann coefficients leave a 5.24% ghost at 300 Hz (just over the 5% target); 35 coefficients (D = 17) bring the worst ghost from 300 to 3,400 Hz down to 2.77%.

Key words: tone, arrow (the line from the wheel's centre to the dot), positive tone / negative tone (not "negative frequency" in prose), mirror arrow (lesson 6), shadow (the left-right position, lesson 6), shift (not "modulate"), ghost (the lower copy; not "image", which is lesson 5's word), wanted copy, analytic signal, Hilbert transformer (not "Hilbert filter"), Hilbert output x̂, plain path, coefficients (lesson 10; not "taps"), single sideband, sideband, quarter turn, ghost meter (lab only, defined in "Your turn").

Terms (new, exact wording in the prose):
- negative tone (helper, needed by the analytic signal): a dot turning clockwise; −1,000 Hz turns −45° per sample, and its shadow sounds exactly like +1,000 Hz.
- analytic signal: a version of the signal made only of positive tones, with every mirror arrow removed.
- Hilbert transformer: an all-pass filter that turns every positive tone back a quarter turn and every negative tone forward a quarter turn.
- single sideband: a shift that keeps only one of the two sidebands, the two copies a plain multiplication makes either side of each call tone (1,300 and 700 Hz for a 1,000 Hz tone).

Reused terms and conventions: impulse response (lesson 2); the wheel (lesson 3: a dot turning counter-clockwise, 360° × tone ÷ 8,000 per sample), gain, phase (lesson 3: how far behind; older is clockwise); mirror arrow, shadow, filter, multiplying points on the circle adds angles; j as a quarter turn counter-clockwise with j × j = −1 and e^{jωn} the dot; ω in radians with π = 4,000 Hz (lesson 6, each recapped in one line before use); all-pass and linear phase (lesson 8); ideal low-pass by adding up wheels, truncation, window, transition band, Gibbs ripple (lesson 10); multiplying arrows costs four multiplications (lesson 13); Hann window and the chord |1 − e^{jx}| = 2|sin(x/2)| (lesson 14). The book is named in full at its first citation.

Misconception (now placed right after the Hilbert transformer is defined, where the reader asks "so it's a delay?"): "The Hilbert transformer is just a delay of a quarter cycle." Why wrong: a delay turns each tone in proportion to its frequency (linear phase): 2 samples is a quarter turn at 1,000 Hz but half a turn at 2,000 Hz and an eighth at 500 Hz; the Hilbert transformer turns every tone by the same quarter turn.

Worked examples:
1. The bug by hand: 1,000 Hz (1.000, 0.707, 0.000, −0.707, −1.000, −0.707, 0.000, 0.707) times 300 Hz (1.000, 0.972, 0.891, 0.760, 0.588, 0.383, 0.156, −0.078) gives 1.000, 0.688, 0.000, −0.538, −0.588, −0.271, 0.000, −0.055, equal to ½(1,300 Hz + 700 Hz) at every sample. Arrow table: +45° ± 13.5° gives +58.5° and +31.5°, mirrored.
2. The fix by hand: x̂ = sine (0, 0.707, 1, 0.707, 0, −0.707, −1, −0.707); x̂ · sin 300 = 0.000, 0.165, 0.454, 0.459, 0.000, −0.653, −0.988, −0.705; y = product − x̂ · sin 300 = 1.000, 0.522, −0.454, −0.997, −0.588, 0.383, 0.988, 0.649 = cos(58.5° × n), 1,300 Hz.

Derivation (the lesson's one derivation is arrow arithmetic, chapter 11 of Oppenheim and Schafer, Discrete-Time Signal Processing, 1989): (1) Hilbert transformer on a cosine's two arrows, ×(−j) and ×(+j), the opposite turn justified by "the output must stay real, so the mirror suffers the mirror image"; x + jx̂ doubles the top arrow and cancels the mirror. (2) The complex product in two steps, j × j = −1, shadow y = x cos ω₀n − x̂ sin ω₀n. (3) The same arithmetic with an extra clockwise turn θ on the Hilbert path gives top 1 + e^{−jθ} (length 2|cos(θ/2)|), mirror 1 − e^{jθ} (length 2|sin(θ/2)|), ghost |tan(θ/2)|. (4) With gain G: top 1 + G, mirror 1 − G, ghost |1 − G|/(1 + G). The impulse response h[n] = 2/(πn) on odd n is now only sketched, by analogy with lesson 10's "add up the wheels".

Figures (one per new concept, where the prose first needs it; each animated figure has a still end frame that carries the whole idea under prefers-reduced-motion):
- [[diagram:split]] (the bug and why no filter helps; animates): top strip, a spectrum line at 1,000 Hz splitting into two half-height lines at 700 and 1,300 Hz. Bottom strip, one axis 0 to 4,000 Hz with three stacked bands: voice 300 to 3,400, wanted copy 600 to 3,700, ghost 0 to 3,100, the overlap shaded and the 1,700 Hz collision marked (ghost of 2,000 on the wanted copy of 1,400). Animation: the voice band splits into its two copies. Still: the three bands with "no filter can separate these". Learner predicts first: where does 1,000 Hz go? (Both 1,300 and 700.)
- [[diagram:negative-tone]] (recap of the wheel and the mirror arrow, naming the negative tone; animates): the circle with the 1,000 Hz top arrow (counter-clockwise, +45° per sample) and its mirror (clockwise, −45°), each half size, the line from centre to dot drawn as the arrow, and their shared shadow as one dot on the horizontal axis tracing the cosine. Still: samples 0, 1, 2 faint to solid, labels "+1,000 Hz", "−1,000 Hz", "same shadow".
- [[diagram:chip-boundary]] (complex inside the chip, real on the line; still): a box labelled "chip" holding arrows (two numbers per sample, left-right and up-down) and an arrow multiplier, with the line leaving the box carrying only the shadow (one number per sample). Caption: "only what goes out on the line has to be a shadow".
- [[diagram:ghost-arrows]] (where the ghost comes from; animates): the same two arrows, then one +300 Hz multiplier arrow applied to both: the top arrow speeds up to +58.5° (1,300 Hz), the mirror slows to −31.5° (−700 Hz), whose shadow is 700 Hz. Still: before and after on two circles, the ghost arrow marked.
- [[diagram:analytic]] (analytic signal; still): the circle with only the top arrow, full size, no mirror; beside it its two parts over 8 samples, cosine (left-right, stored, labelled x) and sine (up-down, needed, labelled x̂), and "x + j x̂ = the dot". A second, faint dot 90° clockwise behind shows that its left-right shadow equals the first dot's up-down position: the sine is the cosine a quarter turn behind.
- [[diagram:hilbert]] (Hilbert transformer; animates; placed after the −j/+j arithmetic and x_a = x + jx̂ in the prose): three columns. (a) A cosine's two half arrows. (b) After the Hilbert transformer: the top arrow turned a quarter turn clockwise (×−j), the mirror a quarter turn counter-clockwise (×+j), with a caption "mirror images stay mirror images: the output stays real". (c) After × j and adding the original: the top arrow lands on itself (doubles), the mirror lands opposite itself (cancels). Animation: the turns happen in sequence. Still: all three columns, with "1 + 1 = 2" and "1 − 1 = 0".
- [[diagram:delay-vs-quarter-turn]] (the misconception; animates): three wheels (500, 1,000, 2,000 Hz) delayed 2 samples fall 45°, 90°, 180° behind; beside them the Hilbert transformer puts all three 90° behind. Still: two rows of three wheels with the angles printed.
- [[diagram:shifter]] (the two-path circuit; still; reused in "The delay catch" and "Your turn"): x splits into a top path (delay D, then × cos 300) and a bottom path (Hilbert transformer, then × sin 300), meeting at a subtraction giving y. Label D = 15 for 31 coefficients. In the delay-catch use, the delay box is highlighted; in "Your turn" it is the lab's wiring layout.
- [[diagram:sideband]] (single sideband; still): a spectrum with the 300 Hz shifting tone marked, the upper sideband (kept) and the lower sideband (crossed out), for the 1,000 Hz tone (1,300 kept, 700 crossed out).
- [[diagram:hilbert-response]] (the frequency response and its jump; still): the response drawn as an arrow per tone from −4,000 to +4,000 Hz: −j (pointing down) for positive tones, +j (pointing up) for negative ones, a cliff at 0 Hz (and the wrap at ±4,000 Hz); overlaid dashed, the 31-coefficient Hann version smoothing the cliff over about 0 to 300 Hz.
- [[diagram:h-sketch]] (where 2/(πn) comes from; still): sin(ωn) over ω from 0 to π for n = 2 (two half-waves, up and down shaded, cancelling) and n = 3 (three half-waves, one upward left over, area 2 ÷ 3), with "average over 0 to π" giving 0 and 2/(3π) = 0.212.
- [[diagram:taps]] (the coefficients; still): stem plot of h[n] for n = −15 to 15 (zeros on even n, ±0.637, ±0.212, ±0.127, ±0.091, ±0.071 on odd n), the Hann taper ½ + ½ cos(πn/16) as a dashed envelope, the n < 0 region shaded "reaches the future", and an arrow "delay 15 samples".
- [[diagram:delay-catch]] (the missing delay; animates): for 1,000 Hz, the analytic signal's two arrows built with the Hilbert path 675° late: top 1 + e^{−jθ} and mirror 1 − e^{jθ} drawn as chords (lesson 14's picture), the mirror no longer zero; a dial for the tone shows the ghost ratio |tan(θ/2)| changing: 20% at 500 Hz, 41% at 1,000 Hz, 100% at 2,000 Hz, 241% at 3,000 Hz. Beside it, a curve of the ghost against tone, 0 to 4,000 Hz, for the missing 15-sample delay, with 20%, 41%, 100% and 241% marked and the 5% target line. Still: the 1,000 Hz chords with "ghost 41%" and the curve.
- [[diagram:edges]] (where a short Hilbert transformer fails; still): gain against tone 0 to 4,000 Hz for 31 Hann coefficients (solid), 35 Hann (dashed) and 31 plain (dotted): 0.387 at 100 Hz, 0.900 at 300 Hz, 1.00 across the middle; voice band 300 to 3,400 Hz shaded; a second axis shows the ghost |1 − G|/(1 + G) with a 5% line.
- No [[machine]]: the arrows on the circle carry the whole mechanism.

Lab:
- [[lab]] act 1, explore: the unit circle with one tone's two arrows and a shift slider (−500 to +500 Hz), a spectrum underneath, and a voice clip. Toggle the multiplier between "300 Hz tone" (two arrows) and "one arrow" (no mirror). Prediction before play: "with a one-arrow multiplier, is the ghost gone?" (No: the mirror arrow still lands at −700 Hz.) The learner should see the mirror arrow slow down as the top arrow speeds up, and its shadow (the ghost) slide down the spectrum. A last toggle, "remove mirror arrows", previews the analytic signal: the ghost vanishes.
- [[lab-act2]] fix the bug: the circuit from [[diagram:shifter]], with the Hilbert transformer's length (7 to 63 coefficients), its window (none / Hann), the plain path's delay (0 to 31 samples) and the 300 Hz shift. A ghost meter shows the ghost as a share of the wanted copy at its worst tone between 300 and 3,400 Hz. Prediction: "31 Hann coefficients with delay 15: under 5%?" (No: 5.24% at 300 Hz.) Traps: delay 0 with 31 coefficients (41% at 1,000 Hz, 100% at 2,000 Hz); no window (2.9% at 1,000 Hz and 6.8% at 300 Hz with 31). Done when the worst ghost is under 5% with a matched delay (35 Hann with delay 17: 2.77%; 39: 1.13%; 63: 0.25%). The lab's Hann must be ½ + ½ cos(πn/(D + 1)) for n = −D to D, the window the numbers use.

Numbers (computed with python3 and cmath; numpy not installed; the 31-coefficient shifter also simulated end to end on cosine tones):
- Turns per sample: 300 Hz 13.5°, 1,000 Hz 45°, 1,300 Hz 58.5°, 700 Hz 31.5°. Voice 300 to 3,400 Hz: wanted 600 to 3,700, ghost 0 to 3,100; ghost of 2,000 Hz at 1,700 Hz.
- Worked example tables at three decimals as above; y equals cos 1,300 Hz at all 8 samples.
- h[n] = 2/(πn), odd n: 0.637, 0.212, 0.127, 0.091, 0.071; same from (1 − cos πn)/(πn).
- Hann ½ + ½ cos(πn/16), n = −15 to 15 (lesson 14's Hann with N = 32, centred), phase exactly −90°: gain 0.3866 (100 Hz), 0.9004 (300 Hz), 1.0016 (1,000 Hz), 1.0050 (3,400 Hz); ghost 44.2%, 5.24%, 0.08%, 0.25%. Simulation: −61.9 dB at 1,000 Hz, −52.0 dB at 3,400 Hz. (The textbook Hann with zero endpoints, ½ + ½ cos(πn/15), would give 6.84% at 300 Hz: the lab must use the same window.)
- Worst ghost 300 to 3,400 Hz (25 Hz steps), Hann: 31 coefficients 5.24%, 35: 2.77%, 39: 1.13%, 43: 0.62%, 63: 0.25%.
- 31 plain: gain 0.9443 at 1,000 Hz (ghost 2.86%), 1.1458 at 300 Hz (6.79%, the worst from 300 to 3,400 Hz in 5 Hz steps, so it fails the 5% target), 0.7333 at 100 Hz (15.4%), 0.9644 at 3,400 Hz.
- h[n] as the average of sin(ωn) over 0 to π, checked numerically: n = 1, 2, 3, 5 give 0.6366, 0, 0.2122, 0.1273.
- Delay 15 samples = 1.875 ms. Unmatched delay, ghost |tan(θ/2)| with θ = 15 × 360° × tone ÷ 8,000: 500 Hz 19.9%, 1,000 Hz 41.4% (θ = 675°), 1,500 Hz 66.8%, 2,000 Hz 100%, 3,000 Hz 241%.
- Misconception: 2 samples is 90° at 1,000 Hz, 180° at 2,000 Hz, 45° at 500 Hz.

Review points (fresh reader, review-15.md) and what changed:
1. Recap or new? Now opens "This part is a recap of two pictures you already own"; the arrow is defined as the line from centre to dot; "half of each arrow" replaced by "two half-size arrows".
2. How can a shadow-only phone multiply by an arrow: now said before the perfect-multiplier question (the chip keeps two numbers per sample; only the line carries a shadow).
3. j never stated: one-line recap (quarter turn counter-clockwise, j × j = −1, c + js means an arrow) before x_a.
4. Opposite quarter turn read as wordplay: now justified by "the output must stay a real signal, so the mirror suffers the mirror image of the top arrow's turn", with [[diagram:hilbert]] placed before the arithmetic and the prose saying what to watch.
5. Complex product not shown: now in two visible steps with j × j = −1.
6. ω and π appear without mapping: one-line recap where the frequency response first uses them.
7. Integral too terse, derivation drags: the integral is cut to a sketch ("add up the wheels, as in lesson 10") plus the coefficient table; the lesson's derivation is now the arrow arithmetic.
8. 41% from nowhere: derived in "The delay catch" from the same arrows, with its variation over tones and [[diagram:delay-catch]].
9. |1 − G|/(1 + G) stated not shown: derived from the same arithmetic as the analytic signal.
10. 4,000 Hz worry: the prose says the voice stops at 3,400 Hz and the Hilbert transformer runs before the shift.
11. Six-row table: cut to three rows (x̂, x̂ · sin 300, y) with one sentence that y is cos(58.5° × n).
12. Repetition about positive and negative tones: cut to one statement.
13. Misconception too late: moved right after the Hilbert transformer's definition.
14. "This is chapter 11 of the book", "the book" never introduced: dropped; the book is named in full at its first citation ("analytic signal").
15. Fragment "So for positive tones, ...": replaced by a full equation and sentence. Step headers removed.
16. Long sentences: the seven flagged are split.
17. Terms and symbols: "taps" replaced by "coefficients" (lesson 10's word); "ghost meter" defined in "Your turn"; e^{jωn} tied to the dot.
18. Lab slots: act 1 text now says what to see; "how much longer is enough" is answered in the sheet (35) and left to the lab in the prose by design.
19. Missing pictures: band overlap folded into [[diagram:split]]; [[diagram:hilbert]] animates the opposite turns; [[diagram:shifter]] added and reused for the delay catch and "Your turn"; [[diagram:delay-catch]] added; [[diagram:hilbert-response]] added for the jump at 0 Hz; [[diagram:analytic]] kept.
20. Gains printed to two decimals did not reproduce the ghost: now four decimals (0.3866, 0.9004, 1.0016, 1.0050, 0.9443) so |1 − G|/(1 + G) reproduces every printed ghost.
21. Hann variant hidden: the formula ½ + ½ cos(πn/16) is stated in the prose, tied to lesson 14's Hann.
22. The plain cut doing better at 100 Hz: now stated in one parenthesis, with why it buys nothing.
23. Lesson numbers: the wheel is lesson 3 (was "lesson 6"), the mirror arrow lesson 6, phase lesson 3 and lesson 8; "a filter treats tones by where they sit" is lesson 6's misconception, kept.

Second review points (review2-15.md) and what changed:
1. Chip paragraph and the lesson 13 reference: rewritten as two plain sentences (keep arrows inside the chip; only what goes out on the line must be a shadow), the lesson 13 reference dropped, with [[diagram:chip-boundary]].
2. Hilbert step order: the −j/+j arithmetic, the multiply-by-j and x_a = x + jx̂ now come first; x̂ is named at the definition; the figure prompt (quarter turn from the filter, another from j, so the mirror ends opposite) comes after, then [[diagram:hilbert]]. The "1" is explained before the bullets ("count each half-size arrow as 1").
3. "Fainter" contradicted half and half: now "Just as loud, a little lower". Lesson 14's cliffhanger "second, fainter voice" is changed to "second voice" to match.
4. ω₀ used before the radians reminder: the reminder and ω₀ = 2π × 300 / 8000 (13.5° per sample) now open "The shift, done right"; the later section no longer repeats it.
5. Delay box missing from the first circuit description: the top path's delay box is now named there.
6. "Either side of the shifting tone": now explained in signed tones (+1,300 and −700 Hz around +300) and as heard (either side of each call tone).
7. Sine as up-down vs cosine a quarter turn behind: linked in one sentence (turning the dot 90° clockwise moves its up-down position onto the left-right axis), and in [[diagram:analytic]].
8. h[n] = 2/(πn) asserted: now sketched (pair each tone with its mirror, 2 sin(ωn), average over 0 to π, half-waves cancel for even n, one left for odd n), with [[diagram:h-sketch]].
9. "Gibbs effect": now "Gibbs phenomenon", lesson 10's name.
10. Plain cut: the prose now states its worst in-band ghost, 6.79% at 300 Hz, fails the 5% target; the 100 Hz parenthesis is cut.
11. Also: "300 Hz slower" (speed mixed with Hz) rewritten in degrees per sample; "suffer the mirror image" rewritten; "Older is clockwise" no longer welded to the phase reminder; the single sideband sentence no longer nests; the jump sentence gives its reason (lesson 10); "the picture" in "Your turn" names the circuit.
12. Pictures: chip-boundary, h-sketch, the ghost-against-tone curve in delay-catch, the sine link in analytic.
Not changed: the recap of lessons 3 and 6 stays two short paragraphs (the coordinator asked for a proper recap of the mirror arrow), and the two-step product stays (the first review asked for it).

Third review points (review3-15.md): (1) the ghost is now "300 Hz below the original, 600 Hz below the wanted copy", in the prose and the recap; (2) the 5% target is stated before "The edges of the band" uses it, and 5.24% "just misses" it; (3) the ghost is written |1 − G| / (1 + G), noting G can overshoot 1; (4) the sidebands are described around one centre, the call tone (1,300 above and 700 below 1,000 Hz); (5) "Here's the question that matters" is followed by the question (what if the multiplier had no mirror?); (6) |1 + e^{−jθ}| = 2|cos(θ/2)| is shown in one step via the mirror-arrow cosine; the integral wording is softened ("roughly speaking").

Next bug: calls through a partner network across the sea carry an echo of unknown delay, made inside the partner's network, with a different delay on every route; lesson 2's echo fix needs the delay, and you cannot send the partner a click (lesson 16, the cepstrum).

Assumptions:
- Lesson 3 teaches phase as how far behind a tone's dot sits (older is clockwise); lesson 8 teaches all-pass and linear phase; lesson 10 derived the ideal low-pass's coefficients by adding up the wheels it passes and taught truncation, windows, transition band and Gibbs ripple; lesson 13 counts an arrow times an arrow as four multiplications; lesson 14 shows the chord |1 − e^{jx}| = 2|sin(x/2)|.
- "Negative tone" is new wording here for the mirror arrow, introduced because the analytic signal needs it. It is not in the table's new terms and may deserve a glossary row.
- The 300 to 3,400 Hz voice band is the standard telephone band. "Ghost" names the lower copy; "image" is avoided because lesson 5 uses it.
- The table's "mirrored copy" is told as a lower copy made by the mirror arrows; it is literally mirrored only for voice tones below 300 Hz (200 Hz goes to 100 Hz), which the prose does not dwell on.
