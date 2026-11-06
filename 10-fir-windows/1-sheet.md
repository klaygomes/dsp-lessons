# The Ghost in the Sweep

Objective: after this, you can design an FIR low-pass by the window method. That means getting the ideal low-pass coefficients sin(πm/2) / (πm) by averaging the wanted gain against each cosine wiggle, and explaining the Gibbs 9% as the left-out negative side lobes of the rectangle's response. It also means choosing a window's shape for the ripple and its length for the transition band, and setting the spec from where tones land after downsampling.

Bug: lesson 5's ready-made anti-aliasing filter (16,000 to 8,000 samples/s) is the ideal low-pass cut to 31 coefficients, cutoff 4,000 Hz. A 4,000 to 8,000 Hz test sweep comes out as a ghost gliding down. It starts as a 50% tone at the very top, fading within 0.75 s (the edge, shrugged off). Then come swells about every 500 Hz all the way down: 9% heard at 3,500 Hz, 5% at 3,000 Hz, 2% at 1,000 Hz. Wideband voice tones near 3,500 Hz come out 9% louder.
Fix: act 2 of the lab, in two cases with opposite answers. First the loading-dock intercom (forgives 10%, band to 3,700 Hz, remove above 4,300 Hz, 31 coefficients, starts on Hamming 15): only the plain cut fits, at 23 to 31 coefficients, because its 9% ripple is allowed and its slope is narrower than Hamming's (Hamming needs 51). Choosing the window is not enough: the plain cut of 15 still fails, so the learner must find the length too. Then your own line: within a 47-coefficient budget, choose a window and length so the voice band 0 to 3,400 Hz passes within 1% and every input above 4,600 Hz is removed to below 1% (−40 dB). The plain cut cannot (its ripple stays near 9%); the reference answer is Hamming 45: 0.24% on both, a comfortable margin; Hamming 41 scrapes through at 0.93%. Done when no ghost lands in the voice band. The leftover slope (inputs 4,000 to 4,542 Hz) lands in the 3,400 to 4,000 Hz margin.

Key words: coefficient (not "tap"; "weight" only for window values), low-pass, ideal low-pass, cutoff, truncation ("cut" only as the everyday verb), window, taper, side lobe, smeared (only as the plain word for "convolved with the window's response"), transition band (not "transition region", "roll-off"), voice band, margin, passes / removes, gain, ripple, overshoot, leak, wiggle (one cosine term of the response), half-swing, the ghost, the sweep, the meter.

Terms:
- turn (named in "Cutting it short", before 2 cos(m × turn)): the angle a tone's arrow turns each sample, 360° × tone ÷ 16,000; 90° for 4,000 Hz, 45° for 2,000 Hz.
- sin, cos (glossed where first used): sin is the dot's height on the wheel after a turn; cos, its partner, the dot's left-right position. h[0] = ½ is given its own line: the formula reads 0 ÷ 0 there, and the middle is the step's average height. log10 is glossed with decibels: the power of ten that makes the number.
- low-pass (plain, first sentence of the bug): a filter that passes low tones and removes high ones.
- cutoff (lesson 4's term, narrowed): the tone where a filter switches from keeping to removing; for this lesson's filters it is measured where the gain is half; here 4,000 Hz.
- ideal low-pass: a low-pass with gain exactly 1 for every tone below the cutoff and exactly 0 for every tone above it.
- FIR filter: a filter with no feedback, so its impulse response is its coefficient list, and then it stops (finite impulse response).
- truncation: keeping only part of a filter's coefficient list and setting the rest to zero.
- Gibbs phenomenon: a cut-short sum of wiggles overshoots a cliff by about 9% of its height, no matter how many wiggles you keep.
- decibels (dB): 20 × log10 of a gain; 10% is −20 dB, 1% is −40 dB, 0.1% is −60 dB.
- window: the list of weights you multiply the ideal coefficients by to keep a finite piece of them.
- taper (named with the first Hamming picture, in "The cut has sharp edges"): a window whose weights fade smoothly from 1 in the middle to almost 0 at the ends, instead of stopping dead.
- side lobes (named inline): the smaller humps on either side of a window response's central hump.
- transition band: the stretch of tones between the last tone a filter passes within 1% and the first tone it removes to below 1%.
- voice band (named, phone convention): 0 to 3,400 Hz, what a phone line promises to carry; 3,400 to 4,000 Hz is a margin left empty.

Reused terms: wheel (lesson 3, canonical wording with 16,000 in place of 8,000), unit circle (lesson 6, the same picture), filter, passes / removes, the arrow and its mirror (lesson 6, recapped in one sentence at the wheel: a real tone is two half-size arrows turning opposite ways, the mirror in the bottom half); impulse response, convolution (lesson 2, here applied to curves over the tones, stated as the book's result); frequency response, gain (lesson 3); alias (lesson 4); downsample (lesson 5); linear phase (lesson 8); coefficient (lesson 9).

Misconception: "A longer filter is a better copy of the ideal one, so the overshoot shrinks with length." · Why wrong: a longer rectangle's response has the same shape, only narrower, so the left-out side lobes are still −9% of the area; length squeezes the ripples, only a smoother shape lowers them.

Worked examples:
1. Truncation at 0 Hz, pair by pair: gain = sum of kept coefficients: 0.5000, 1.1366, 0.9244, 1.0517, 0.9608, 1.0315, 0.9737, 1.0226, 0.9802 for 1, 3, 7, ..., 31 coefficients (summed before rounding). Each pair adds 2 h[m] cos(m × turn) (arrow and mirror). At 4,000 Hz every odd pair is zero, so the gain is exactly 0.5 at any length. At 4,500 Hz (turn 101.25°) the pair contributions are 0.5, −0.1242, −0.1179, −0.1059, −0.0892, −0.0694, −0.0481, −0.0272, −0.0083, summing to −0.0901.
2. Hamming window, 31 coefficients, by pencil (folded table, one row per n): ideal × weight 0.54 + 0.46 cos(2πn/30) = new coefficient (0.5000, 0.3151, −0.0968, 0.0490, −0.0267, 0.0141, −0.0067, 0.0029, −0.0017; weights 1.000, 0.990, 0.912, 0.770, 0.588, 0.398, 0.232, 0.120, 0.080). Ungated, Hamming 31 against the plain cut 31 at 4,300 Hz: 22% against 0.6%. Locked until your own line is fixed: Hamming 45 against plain 45 (5% wobble and leak for plain 45; 0.24% on both bands for Hamming 45, −52 dB at the 4,600 Hz edge, ripple below −54 dB from 4,700 Hz up, a floor that shifts with length, about −51 dB at 31; 3,500 Hz at 98%).

Derivation (no calculus):
1. The response is h[0] + Σ 2 h[m] cos(m × turn), a sum of wiggles. Over 0 to 8,000 Hz (turn 0° to 180°), cos(m × turn) makes m half-swings.
2. cos a cos b = ½ cos(a − b) + ½ cos(a + b), and each half-swing from peak to trough averages zero, so different wiggles average to zero against each other, while a wiggle times itself averages to one half.
3. So h[m] = average of gain × cos(m × turn).
4. For the ideal: an eight-tone pencil check (h[0] = 0.5, h[1] ≈ 0.3204, h[2] = 0) and a thousand-tone check (0.5, 0.3183, 0, −0.1061, 0, 0.0637). The exact sin(πm/2)/(πm) is quoted from the book.

Gibbs mechanism, in prose: the cut response is the ideal step convolved with the rectangle's response. At the peak, the main hump sits fully on the pass side, and the lobes past the cliff (starting with the first negative side lobe) add to −8.95% of the area, so 108.95% remains. Length only narrows the lobes, so the share is fixed.

Figures (in prose order; the prose says what each shows just before its slot; animated ones end on a still that carries the idea under reduced motion):
- [[diagram:wheel16k]] (wheel at 16,000 samples/s): dots at 0°, 45°, 90°, 135°, 180° for 0, 2,000, 4,000, 6,000, 8,000 Hz; the top-right quarter is shaded "pass", the top-left "remove", and the bottom half greyed (mirror arrows). Animates: a 4,000 Hz dot steps 90° per sample for four samples. Still: dots and shaded quarters. Sample stops n = 0 to 3 and the moving 4,000 Hz dot sit on an inner dotted ring, apart from the tone ticks on the rim; the prose glosses n just before the figure.
- [[diagram:cutoff]] (cutoff): the wanted response, a step from 1 to 0 at 4,000 Hz over 0 to 8,000 Hz, the cliff labeled "cutoff". Still.
- [[diagram:fir]] (FIR filter): a click (1, 0, 0, ...) entering a delay line with no feedback path, the coefficient list leaving one per sample, then zeros. Animates: the click walks the delay line. Still: input, filter, output list, "and then it stops". The prose names h[0], h[1], ... (h[n] multiplies the sample from n samples ago) just before it. A sentence after it bridges the numbering: the picture counts h[0] to h[4] from the first number (middle at h[2]); from then on the middle is h[0] and earlier ones are negative.
- [[diagram:ideal]] (ideal low-pass): stems n = −15 to 15 (even ones zero, odd ones alternating, shrinking like 1/n), arrows at both ends "continues forever", beside the step. Still. On phones the "continues forever" labels sit lower, clear of 0.3183. The prose glosses sin (the dot's height on the wheel) beside the formula.
- [[diagram:truncation]] (truncation): the 0 Hz running total as a staircase 0.5, 1.137, 0.924, ... 0.980 around a line at 1, beside the stems (kept solid, dropped faded). Animates: one pair per beat. Still: full staircase.
- [[diagram:pair-cosine]] (pair to cosine): h[m]'s arrow turned back m steps and h[−m]'s turned forward m steps; their sum on the flat line, length 2 h[m] cos(m × turn). Animates: the turn grows, the sum slides. Still: arrows at 30° with the flat sum marked, and an inset at 90° where the odd pair's sum is zero.
- [[diagram:pair-bars]] (negative gain from its parts): bars for the 4,500 Hz contributions (0.5, −0.124, −0.118, −0.106, −0.089, −0.069, −0.048, −0.027, −0.008) and a final bar for the total, −0.090, with an inset of a sine and its flipped copy labeled "−0.09 is 9%, upside down". Still.
- [[diagram:sweep-ghost]] (the bug, in time): two strips sharing a 10 s time axis. Top: sweep frequency 4,000 to 8,000 Hz. Bottom: ghost frequency 4,000 to 0 Hz, with loudness drawn as line thickness: 50% at the start fading by 0.75 s, then swells of 9% (3,500 Hz), 5% (3,000), 2% (1,000), with gaps at the zero crossings (4,306, 4,778, 5,267 Hz input). Thickness is linear in loudness (90 × gain, less a little, so gaps open), and a dotted line marks where the ghost would sit. Voice band shaded on the bottom strip, labelled "where voices live" (the term voice band comes later). Still.
- [[diagram:gibbs]] (Gibbs): plain-cut responses near the cutoff for 15, 63 and 255 coefficients (solid, dashed, dotted), a guide at 1.09 that every peak touches, and peaks at 3,000, 3,750 and 3,938 Hz. Animates: length grows, the ripple squeezes, its height stays. Still: the three curves and the guide.
- [[diagram:decibels]] (decibels): a ladder of 100%, 10%, 1%, 0.1% against 0, −20, −40, −60 dB, with the plain cut's 9% at −21 dB and the target 1% at −40 dB. Still.
- [[diagram:wiggles]] (derivation step one): stacked 2h[1] cos(turn), 2h[3] cos(3 × turn), 2h[5] cos(5 × turn) over 0 to 8,000 Hz (1, 3, 5 half-swings), then their running sum with h[0], leaning toward the step. Still.
- [[diagram:average]] (derivation step two): cos(turn) × cos(3 × turn) over 0 to 8,000 Hz with its running average settling on zero; beside it cos(3 × turn) squared, its average settling on one half. Animates: the running averages fill in. Still: both finished, with the averages marked.
- [[diagram:gibbs-build]] (sum of wiggles builds the cliff): pairs added one at a time up to 31 coefficients; the peak readout stays at about 1.09 while the bump narrows. Animates: one pair per beat. Still: the 3-, 7-, 15- and 31-coefficient curves overlaid. Folded with the proof (see Folded prose).
- [[diagram:window]] (window): three stem rows multiplied stem by stem: the ideal list (endless), the rectangle (1 for n = −15 to 15), and the product (31 kept). Still.
- [[diagram:rect-response]] (a window's own response): left, the 31-long rectangle's response (central hump, first side lobes negative at about 22% of the hump, alternating, slowly shrinking), side lobes labeled; right, the Hamming response at the same length, 31, on the same scale (a hump about twice as wide, side lobes under 1%, too small to see). Equal lengths, so the width difference is the window's shape alone. Still.
- [[diagram:smear]] (convolution, the 9% mechanism): the rectangle's response slides along the ideal step. The running pass-side area draws the cut filter's curve. At the peak, the main hump touches the cliff and the left-out lobes are shaded with "−9%". Then the Hamming response slides and draws a gentle slope. Animates: both slides. Still: both humps parked at the cliff with the finished curves and the shaded left-out lobes. Both humps are 31 long (Hamming parked at 2,968 Hz, where its main hump touches the cliff); the left-out lobes are hatched as well as edged, for grayscale.
- [[diagram:spec]] (the job): input axis 0 to 8,000 Hz: green 0 to 3,400 pass, grey 3,400 to 4,600 slope, red 4,600 to 8,000 remove. Arrows go to the output axis 0 to 4,000 Hz: red lands in 0 to 3,400 (voice band), grey lands in 3,400 to 4,000 (margin). Animates: the red band folds onto the voice band. Still: both axes with arrows.
- [[diagram:taper]] (Hamming taper): the bell 0.54 + 0.46 cos(2πn/30) over n = −15 to 15 (1 in the middle, 0.08 at the ends) laid over the 31 ideal stems, with the products drawn as a second, shorter set. Built at 31 so no ungated picture names a length that passes your own line. Still.
- [[diagram:transition-band]] (transition band): the Hamming 31 response with thin 1% strips around 1 and 0, and the band from 3,191 to 4,809 Hz (about 1,600 Hz) shaded. Hamming 31 so this ungated figure does not show a setting that passes your own line. Still. Strip labels say "thin strip", not a colour.
- [[diagram:trade]] (the window trade): top, rectangle and Hamming weights, both 31 long; bottom, both responses in dB, with ripple levels marked at −21 dB (rectangle) and −51 dB (Hamming, from 5,000 Hz up). Still. The rectangle is drawn on top of the Hamming curve so its first side lobe stays visible.
- [[diagram:done]] (after act 2): the Hamming 45 response over the job's mask, inside green and red, slope crossing grey; the meter's two bars at 0.24%. Still. The phone layout also ticks 4,600 Hz.

Lab:
- [[lab]] act 1, explore: the prose sets it up just before the slot (the strip, "Play the sweep", which loops until Stop, and "Filter on", which switches the filter out so you hear the downsampler alone). Rectangular window only, length slider (7 to 255, steps of four). It shows the response curve (linear), readouts for the highest gain below the cutoff and the dip past it, with a one-clause gloss of a negative gain ("9.0% of that tone still gets out, flipped upside down"), and a play button for the sweep through filter and downsampler, with the ghost strip drawn live. The strip draws loudness as thickness, linear (70 × gain, at least 1.2 px), from a running maximum over ±0.04 s, coral wherever it is over 1%, nothing under 1%; a ring marks the dip on the strip and a label gives its size and where it is heard (9.0% at every length). From 127 coefficients up the readout adds: the dip's ghost is still 9%, now heard above 3,400 Hz, but inside 0 to 3,400 Hz the ripples still reach the live value (2.03% at 127, 1.02% at 255), and the plain cut only gets under 1% there at 271, more than five times the 47 the chip affords. With the filter off, the curve fades, a label says every tone reaches the downsampler at full strength, and the readout says so. "Pinned" is dotted, the ideal step dashed. The first prediction (above the 0 Hz table) has parallel options: climbs to 1 without passing it / passes 1 and swings around it / stays well below 1 for long. Prediction before the slider unlocks: "At 255 coefficients, what happens to the bump above 1?" The right-answer feedback does not print the result: "Drag to 255 and see what changes instead." The ghost legend item is hidden until the prediction is answered. The filter-off label sits on a paper plate so the cliff does not cross it. At long lengths the readout adds "(too thin to stand out on the strip)" when the voice-band ripple is under 1.5%. Peak and dip tones are rounded before the heard tone is computed (dip 4,063 Hz, heard at 3,937 Hz). The strip is clipped to its box, so the filter-off band no longer covers the time labels. Axis text is 12 px on desktop, 11 px on phones.
- [[lab-act2]] act 2, fix: window choice (rectangle, Hamming) plus length (7 to 99, steps of two; when a plain cut has length 4k + 1 the readout says it is the same filter as 2 shorter, because its outermost pair is even and zero). Each case prints its job; the meter has two bars, the carried band (largest deviation from 1 up to its top tone) and the ghost (largest leak above 8,000 Hz minus that tone), with a line at the case's limit (1% on a 0 to 10% scale, or 10% on a 0 to 20% scale). The dB view draws the limit line (−40 or −20 dB) from the remove edge up. On the strip, coral is a ghost heard inside the carried band over the limit; an outlined grey ribbon is a ghost the line allows (within its limit, or heard above its band); the legend swatches are filled and outlined. Evaluate on a 1 Hz grid so Hamming 41 (0.929%) does not flicker. With the filter off, the meters grey out and read "filter off: every tone at full strength", the readout says the downsampler alone folds every tone in, and nothing counts as fixed. Feedback names the mistake, never the fix: "its slope is wider than the 600 Hz this line leaves for it"; for a plain cut on a 1% line, "its 9% bump sits at 3,750 Hz, past the band's 3,400 Hz edge, but its ripples still reach 3.36% inside the band"; "would do the job, but this chip affords only 31". Success reads "ghost at most". A legend item explains the coral dots on the gain plot (where the band strays most or the ghost leaks most, over the limit), shown only while failing. The allowed ghost is drawn as two ink edges with no fill, the over-limit ghost solid coral. The intercom's text glosses "carried band" (the tones it must deliver, 0 to 3,700 Hz). "Your turn" says in one line why act 2 moves in steps of two. The intercom hint for "Both" asks what else the job needs and whether both windows have it at 31. The scale button reads its state: "Scale: dB" or "Scale: gain".
  - Case 1, the loading-dock intercom (story: shouted announcements only need to be understood): band to 3,700 Hz, remove above 4,300 Hz, both within 10% (−20 dB), budget 31, starts on Hamming 15 (fails, 35.81%). Prediction before the controls unlock: "Which window can do this job?" (only the plain cut, only Hamming, both, neither). Answer: only the plain cut, because its ripple, near 9%, is under 10% and at the same length its slope is narrower (the hint recalls 4,300 Hz at 45: Hamming 12%, plain cut 7%). Switching gives the plain cut of 15 (21.42%, fails), so the learner still has to find the length: 23 to 31 pass, 33 and up are over budget; Hamming needs 51.
  - Case 2, your own line: 3,400 / 4,600 Hz, 1%, budget 47, starts on lesson 5's plain cut of 31. The plain cut cannot pass in budget (it needs 271); Hamming passes at 41, 43, 45 and 47 (45 recommended); 49 and up are over budget, so dragging to the end fails and the learner must read the meter. Solving it unlocks the locked prose and plays the ending.
  - "Try another", in turn: a second wideband bridge (3,500 / 4,500 Hz, 1%, 63: Hamming from 49), the warehouse walkie-talkie gateway (3,600 / 4,400 Hz, 10%, 33, starts on Hamming 13, its text does not compare it with the intercom: plain cut from 19, Hamming needs 39), an old radio link (3,000 / 5,000 Hz, 1%, 27: Hamming 25 or 27), a hotel exchange (3,200 / 4,800 Hz, 1%, 39: Hamming from 33). Every default fails, and switching window alone from a default does not pass.
  - Hann is not in the lab; the prose does not mention it.
- Locked prose (unlocked by fixing your own line): in "A window with soft edges", the plain-cut-45 against Hamming-45 table with the paragraph after it, the "Why 45 and not fewer?" paragraph, and the "first moment still leaks" paragraph; in "Your turn", the done figure. The 4,300 Hz paragraph stays open and states its own numbers. Every ungated Hamming number for the transition band and the dB trade uses Hamming 31 (fails your line) or 89 (over budget), so nothing above the lab proves an in-budget passing setting. Every lock note reads only "Opens after you fix your own line." The ungated text was searched (prose, captions, SVG text, aria labels, figure descriptions, lock notes) for 41, 43, 45 and 47 near "Hamming": no hits.
- Folded prose (always openable, closed by default): in "Where the coefficients come from", the four derivation steps, the eight-tone pencil check, and the pairs-building-the-cliff paragraph with its animation, behind "Show the proof: four steps, a pencil check, and the pairs building the cliff". The section's open paragraph says the result in one sentence. The section after act 1 is headed "Above one and below zero" (not "Nine percent, forever", which spoiled act 1's prediction); its bug table keeps only 3,500, 4,000, 4,500, 5,000 and 7,000 Hz, and the peaks-by-length table is cut (act 1 and the Gibbs overlay show it). The Hamming pencil table is transposed (one row per n) so it fits; tables that still scroll at phone width get an edge shadow. The Hamming pencil table (now at 31) is folded too, behind "Show the pencil table: the new coefficients, one by one".

Numbers (computed in python3 with math, no numpy available; fs = 16,000, ω_c = π/2, response H(f) = Σ h[k] cos(ω (k − M)); window convention cos(2πn/(N − 1)) for Hamming and Hann):
- Ideal coefficients for m = 0 to 21: 0.5, 0.3183, 0, −0.1061, 0, 0.0637, 0, −0.0455, 0, 0.0354, 0, −0.0289, 0, 0.0245, 0, −0.0212, 0, 0.0187, 0, −0.0168, 0, 0.0152. Also |h[101]| = 0.0032 and |h[1001]| = 0.0003.
- Pair contributions 2/(πm) for m = 1, 3, ..., 15: 0.6366, 0.2122, 0.1273, 0.0909, 0.0707, 0.0579, 0.0490, 0.0424. The partial sums (unrounded) are as in example 1, with 0.97366 at 23 coefficients.
- Eight-tone averages (turns 11.25° + 22.5° k): h[0] 0.5, h[1] 0.3204, h[2] 0, h[3] −0.1125. Cosines: 0.9808, 0.8315, 0.5556, 0.1951; 0.9239, 0.3827, −0.3827, −0.9239. The thousand-tone averages match the table.
- Plain cut 31, gain by input tone:

  | Hz | gain | Hz | gain | Hz | gain |
  |---|---|---|---|---|---|
  | 0 | 0.980 | 4,100 | 0.304 | 5,000 | 0.050 |
  | 3,400 | 1.073 | 4,200 | 0.133 | 5,500 | −0.035 |
  | 3,500 | 1.090 | 4,300 | 0.006 | 6,000 | 0.028 |
  | 4,000 | 0.500 | 4,500 | −0.090 | 7,000 | 0.021 |
  |  |  | 4,600 | −0.073 | 7,500 | −0.020 |

  Zero crossings at 4,306.2, 4,777.9 and 5,267.2 Hz, written 4,306, 4,778, 5,267.
- Sweep timing: the sweep moves 400 Hz/s; one 500 Hz ripple takes about 1.25 s, and the fade from 4,000 to 4,300 Hz takes 0.75 s. Alias: f becomes 8,000 − f.
- Peak below the cutoff vs length (rectangular):

  | coefficients | peak | at Hz |
  |---|---|---|
  | 15 | 1.0921 | 3,000 |
  | 31 | 1.0901 | 3,500 |
  | 63 | 1.0897 | 3,750 |
  | 127 | 1.0895 | 3,875 |
  | 255 | 1.0895 | 3,937.5 (0.5 Hz grid) |

  The limit is 0.5 + Si(π)/π = 1.0895, so the left-out lobes are −0.0895.
- History: Gibbs described the overshoot in letters to Nature (1898 to 1899); Bôcher analysed it and named it after Gibbs (1906); Wilbraham had found it in 1848 (not in the prose).
- dB conversions:

  | gain | dB |
  |---|---|
  | 0.09 | −20.9 |
  | 0.05 | −26.0 |
  | 0.01 | −40.0 |
  | 0.0024 | −52.2 |
  | 0.0019 | −54.4 |

- Hamming 45 weights 0.54 + 0.46 cos(2πm/44), for m = 0, 1, 3, ..., 21: 1.000, 0.995, 0.958, 0.888, 0.789, 0.670, 0.540, 0.410, 0.291, 0.192, 0.122, 0.085. Coefficient sum 1.0011.
- Hamming 45 vs plain cut 45, gain by input tone:

  | Hz | Hamming 45 | plain 45 |
  |---|---|---|
  | 0 | 1.0011 | 1.0144 |
  | 1,000 | 0.9992 | 0.9888 |
  | 3,000 | 1.0008 | 1.0234 |
  | 3,400 | 0.9976 | 0.9823 |
  | 3,500 | 0.9811 | 1.0390 |
  | 4,000 | 0.5 | 0.5 |
  | 4,300 | 0.1247 | −0.0729 |
  | 4,500 | 0.0189 | −0.0390 |
  | 4,600 | 0.0024 | 0.0177 |
  | 4,700 | −0.0018 | 0.0478 |
  | 5,000 | −0.0008 | −0.0234 |

- Hamming 45 bands: worst error over 0 to 3,400 Hz and worst leak above 4,600 Hz both 0.244%. The largest gain from 4,700 Hz up is −54.4 dB. Transition band 3,458 to 4,542 Hz; Hamming 89: 3,729 to 4,271 Hz. Plain 45: worst error 4.93% on both bands.
- Hamming 31 transition band: 3,191 to 4,809 Hz; 0.947 at 3,400 Hz, 0.053 at 4,600 Hz, 0.219 at 4,300 Hz; largest gain from 5,000 Hz up −51.4 dB, from 5,400 Hz up −53.4 dB. Hamming 47: 0.23% on both bands.
- Other lengths and windows:
  - Hamming 31: 0.947 at 3,400 Hz, 0.053 at 4,600 Hz (fails).
  - Hamming 41: 0.929% on both bands, with −54.5 dB from 4,700 Hz up.
  - Hann (N − 1 convention): 41 gives 1.113% (fails), 43 gives 0.635%.
  - Blackman passes from 55.
  - Rectangle 271: 0.930% on both bands, edges 3,408 and 4,592 Hz, 3,500 Hz at 0.99956.
- Act 2 cases (worst error over the band, equal to the worst leak, 1 Hz grid):
  - Intercom, 3,700 / 4,300 Hz, limit 10%: plain cut 15 gives 21.42%, 21 gives 15.25% (fails), 23 gives 9.68%, 31 gives 9.01%, 39 gives 8.99%; Hamming 15 gives 35.81%, 31 gives 21.85%, 39 gives 16.10%, 49 gives 10.30%, 51 gives 9.29%.
  - Walkie-talkie gateway, 3,600 / 4,400 Hz, limit 10%: plain cut 13 gives 21.40%, 17 gives 13.30%, 19 gives 9.12%; Hamming 25 gives 20.47%, 37 gives 10.30%, 39 gives 8.97%.
  - Second bridge, 3,500 / 4,500 Hz, 1%: Hamming 47 fails, 49 gives 0.93%, 53 gives 0.33%.
  - Radio link, 3,000 / 5,000 Hz, 1%: Hamming 25 gives 0.93%, 27 gives 0.49%.
  - Hotel exchange, 3,200 / 4,800 Hz, 1%: Hamming 33 gives 0.43%.
- Delays: 15 samples is 0.94 ms (bug filter); 22 samples is 1.375 ms (Hamming 45).
- Rectangle response first side lobe: about −13 dB, 22% of the central hump (large-N value of the Dirichlet kernel).

Next bug: the old analog exchange is retired; copying its 3,400 Hz filter with the textbook recipe (the bilinear transform) puts the digital cutoff at 2,363 Hz (lesson 11).

Assumptions:
- Lesson 5's ready-made filter is exactly this bug filter (plain cut-short ideal low-pass, 31 coefficients, 16,000 samples/s, cutoff 4,000 Hz). Lesson 5 taught that downsampling 16,000 to 8,000 turns f into 8,000 − f.
- Lesson 9 defines "coefficient". Lesson 2 teaches impulse response and convolution (slide, multiply, add). Lesson 8 teaches that symmetric coefficients give linear phase. Lesson 6's derivation teaches the arrow and its mirror.
- The voice band 0 to 3,400 Hz and the empty 3,400 to 4,000 Hz margin are stated as phone convention. They set the spec (pass up to 3,400 Hz, remove above 4,600 Hz).
- Your own line's act 2 budget is 47 coefficients, larger than the bug filter's 31 because no 31-coefficient window meets the honest spec, and small enough that the plain cut obviously cannot and dragging Hamming to the end overshoots. The second bridge keeps 63.
- The intercom and the walkie-talkie gateway forgive 10%: a story choice, so act 2 has a case where the plain cut is the right window and the learner must weigh ripple against slope instead of always reaching for Hamming.
- Decibels, the Gibbs phenomenon, FIR and side lobes are introduced here though the table lists no such terms.
- The derivation avoids integrals. That multiplying coefficient lists convolves their responses is stated as the book's result, not proved.
- The Kaiser window, which the book develops, is left out. Hamming is the taught taper.
- The coordinator's note said "from 0 to 4,000 Hz, cos(m × turn) makes m half-cycles". On the 16,000 samples/s side the tones run 0 to 8,000 Hz (turn 0° to 180°), and that is the range over which cos(m × turn) makes m half-swings. The prose uses 0 to 8,000 Hz.
