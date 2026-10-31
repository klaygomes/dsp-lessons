# The Wall on the Line

Objective: after this, you can measure a linear, time-invariant system's frequency response (gain and phase per tone), compute it from a short impulse response by adding arrows, and undo a muffle by boosting each band by one over its gain.

Bug: calls on the new east route sound muffled, as if through a wall (an old smoothing circuit, fitted to hide a now-retired exchange's crackle, with impulse response 0.15, 0.70, 0.15).
Fix: act 2 of the lab: measure the route's gain per band with test tones, then set each band's boost to 1 ÷ gain so route and boost together keep every band between 95% and 105%.

Key words: tone (not "note"; "frequency" only inside "frequency response" and as the book's word for pitch in Hz), the wheel and the dot (not "circle", "phasor", "unit circle"; unit circle is lesson 6), turns (not "rotates", "spins"), arrow (for a weighted copy in the sum), gain (not "attenuation", "level"), phase (not "lag", "offset"; "behind" and "trails" only as plain verbs explaining phase), frequency response (not "spectrum", "transfer function"), boost (not "amplify", "equalize"), band, the east route, the click (lesson 2's impulse), recipe (for the tones' proportions), keeps (for gain as a percentage; "passes" is lesson 6's word, avoid it here).

Terms (new here):
- tone as a wheel: a dot turning 360° × tone ÷ 8,000 per sample, whose left-right position is the sample. 45° for every 1,000 Hz.
- gain: how much a system scales one tone: output size divided by input size.
- phase: how many degrees the output's dot trails the input's.
- frequency response: for every tone, how much the system scales it and how far it delays it.
- band (small extra term, not in the table): a stretch of neighboring tones that share one boost, named by the tone at its middle.

Reused: sample (lesson 1), signal, system, linear, time-invariant, clipping of the gain stage (lesson 1), impulse, impulse response, convolution (lesson 2).

Misconception: "A muffled voice was blurred or smeared: the route added or mixed sound." Why wrong: a linear, time-invariant system only scales and delays each tone; every tone out went in, and only a non-linear stage such as lesson 1's clipping adds tones. Story beat, not the sheet's misconception: the volume knob scales every tone equally, so the recipe stays muffled and loud callers clip.

Worked examples:
1. 2,000 Hz tone (1, 0, −1, 0, ...) through y[n] = 0.15 x[n] + 0.70 x[n−1] + 0.15 x[n−2]: out 0, 0.70, 0, −0.70, ... Same tone, gain 0.70, one sample late (phase 90°). Check with 0 Hz: gain 1.
2. 500 Hz + 3,000 Hz (vowel swell plus consonant edge), n = 0..9; outputs start at n = 2 because each needs the two samples before it. Each tone at size 0.5, so the input stays inside ±1. Convolution output n = 2..9 (from the unrounded samples): 0.279, 0.345, 0.359, −0.244, −0.014, −0.345, −0.624, −0.245, equal (to one in the last digit) to 0.977 × (500 Hz one late) + 0.488 × (3,000 Hz one late) (n = 2: 0.451 − 0.172 = 0.279). Labelled pairs, one sample shifted: n = 6 pure vowel −0.35 → −0.345; n = 4 pure consonant −0.50 → −0.244. Recipe 1 : 1 becomes 0.977 : 0.488.

Derivation: y = Σ h[k] cos(ωn − ωk) = A cos ωn + B sin ωn, A = Σ h[k] cos ωk, B = Σ h[k] sin ωk (sine = the dot's up-down reading). Arrow convention (series-wide): dots turn counter-clockwise, so a copy k samples old sits ωk CLOCKWISE behind; arrows of length h[k] point ωk clockwise, tip to tail, and end at (A, −B). G = √(A² + B²), φ = how far clockwise the end point sits (not tan φ = B/A, which fails at 2,000 Hz and in the left half); y = G cos(ωn − φ). Worked check at 3,000 Hz only (the 1,000 Hz check was cut as a repeat of the table): end point (−0.345, −0.345), G = 0.488, φ = 135°. Book form H(e^{jω}) = Σ h[k] e^{−jωk} = A − jB: size = gain, angle = −φ (the minus sign is the clockwise).

Figures (every new idea has its own slot where the prose first needs it; each animation ends on a frame that reads alone as a still under reduced motion):
- [[diagram:click]]: stem plot, one bar of 1 at n = 0 going in, three bars 0.15, 0.70, 0.15 coming out at n = 0, 1, 2. Static.
- [[diagram:convolution]]: the three-weight window (0.15, 0.70, 0.15) sliding along an input stem row, each output stem growing as the window passes. Animates the slide; still shows the window at one position with the sum written out.
- [[diagram:tone-in-out]]: 2,000 Hz input and output stems overlaid on one axis, an arrow for the one-sample shift and a bracket at 70% height. Static.
- [[diagram:wheel]]: the canonical wheel (reuse 06-zeros-and-poles/2-diagram-wheel.html, extended with 3,000 Hz at 135°). Animates: the dot turns one step per sample and its left-right position drops onto a sample strip below, shown for 1,000, 2,000 and 4,000 Hz side by side. Still: the stops for 0 to 4,000 Hz with their readings. Learner predicts: where the 3,000 Hz dot sits after two samples (270°, straight down, reading 0); the 2,000 Hz case is already worked out in the prose above the figure.
- [[diagram:phase]]: one wheel with the input dot and the output dot for 2,000 Hz, the 90° between them shaded and labelled "phase". Animates: both dots turn together, the gap constant. Still: one frame with the shaded angle.
- [[diagram:arrows-turning]]: first the fresh, one-old and two-old dots on the wheel at 1,000 Hz (one-old 45° clockwise behind, two-old 90° clockwise behind), then the same three arrows 0.15, 0.70, 0.15 laid tip to tail (0°, −45°, −90°), with their sum as a fourth arrow; all four turn together counter-clockwise at 45° per sample. Animates the rotation (looping); still shows one frame with the sum arrow marked "same speed". Replaces the roundabout simile.
- [[diagram:response]]: the route's gain 0.7 + 0.3 cos ω from 0 to 4,000 Hz (100% down to 40%), with the phone band 300 to 3,400 Hz marked, the vowel region and the consonant band 2,000 to 3,400 Hz shaded, a marker for "s"; a second thin panel for phase, a straight line 0° to 180°. Static. Learner predicts: which band the wall hurts most.
- [[diagram:same-delay]]: two wheels side by side, 1,000 Hz and 2,000 Hz, each with a one-sample lag shaded: 45° on one, 90° on the other. Animates both turning; still shows the shaded angles.
- [[diagram:parts-sum]]: worked example 2, n = 2..9: the 500 Hz part (× 0.977, one late), the 3,000 Hz part (× 0.488, one late), their sum, and the click-rule output; the last two coincide. Replaces the former "sum of the parts" table row. Animates: the parts add column by column and land on the click-rule points. Still: all four traces.
- [[diagram:two-tones]]: stacked traces for the 500 Hz part, the 3,000 Hz part and their sum, input and output, then one overlay of input against the output shifted one sample, the halved zigzag highlighted. Static.
- [[diagram:recipe]] (dropped from the page after the round 3 learner judge: two-tones and volume make the same point): two-bar recipe chart, 500 Hz against 3,000 Hz, before (1.00, 1.00) and after the route (0.977, 0.488). Animates: the 3,000 Hz bar shrinks. Still: before and after side by side.
- [[diagram:volume]]: the same recipe bars at × 2 (1.95, 0.98), ratio still 0.50, beside the two-tone caller's samples through the route at × 2 against the line's range ±1, where n = 8 (−1.25) pokes through and clips. Static.
- [[diagram:point]]: the clockwise arrow chain and its end point (A, −B), the distance G and the clockwise angle φ, for 1,000 Hz (end (0.645, −0.645), 45° clockwise) and 3,000 Hz (end (−0.345, −0.345), lower left, 135° clockwise), noting that tan alone would say 45°. Static.
- [[diagram:arrows]]: a strip of clockwise arrow chains at 0, 1,000, 2,000, 3,000 and 4,000 Hz, the chain curling round and its end point shrinking from 1 to 0.4 and swinging to 180° clockwise; at 2,000 Hz the small arrows cancel and the 0.70 arrow points straight down. Animates: the tone sweeps and the chain curls continuously; still is the five-chain strip.
- [[diagram:tone-bars]] (misconception): a voice as one bar per tone, before and after the route: same bars, same places, the high ones shorter. Animates: the bars shrink to their gains. Still: before and after side by side.
- [[diagram:cascade]]: three gain curves stacked: the route (falling), the boost (rising, 1 ÷ gain), their product (flat at 100%), beside a flat × 2 volume line for contrast. Static.
- [[diagram:bands]]: the lab's seven bands from 250 to 3,550 Hz, each centred on its name (500, 1,000, 1,500, 2,000, 2,500, 3,000 and 3,400 Hz), with 0 to 250 and 3,550 to 4,000 Hz shaded as having no knob, each with its knob and target boost. Static.

Lab:
- [[lab]] act 1, explore: a tone slider 0 to 4,000 Hz, two wheels (into the route, out of the route) turning one step per sample, a readout of gain and phase, and a play button for the tone before and after. Predict first: is the gain at 4,000 Hz above or below the gain at 2,000 Hz? (Below: 40% against 70%; the prose states the answer right after the slot.)
- [[lab-act2]] act 2, fix: the west route, impulse response hidden and different from the east route's (use h = 0.10, 0.80, 0.10, gain 0.8 + 0.2 cos of the turn: 100% at 0 Hz, 66% at 3,000 Hz, 60% at 4,000 Hz), so the prose's boost table cannot be copied. Seven bands as in [[diagram:bands]]. Step 1: send each test tone, read the gain. Step 2: set each boost knob. Pass: every band's combined gain between 95% and 105%, then the caller's voice plays crisp and no louder than the original. A volume knob is also present; turning it up leaves the band ratios unchanged and, past 2×, triggers lesson 1's clip buzz on a loud caller.

Numbers (computed with python3, math module; gain = 0.7 + 0.3 cos ω for the symmetric route, phase = ω):
- 0 Hz 1.000, 0°; 300 Hz 0.992, 13.5°; 500 Hz 0.977, 22.5°; 1,000 Hz 0.912, 45°; 1,500 Hz 0.815, 67.5°; 2,000 Hz 0.700, 90°; 2,500 Hz 0.585, 112.5°; 3,000 Hz 0.488, 135°; 3,400 Hz 0.433, 153°; 4,000 Hz 0.400, 180°.
- Angle of (A, B) (atan2): 2,000 Hz (0, 0.70) 90°; 3,000 Hz (−0.345, 0.345) 135°; 4,000 Hz (−0.40, 0) 180°. tan alone gives −45° at 3,000 and 0° at 4,000.
- Boosts 1 ÷ gain: 1.02, 1.10, 1.23, 1.43, 1.71, 2.05, 2.31 for 500 to 3,400 Hz; products with the rounded boosts 0.997 to 1.003.
- 1,000 Hz: A = 0.645, B = 0.645, G = 0.912, φ = 45°.
- Example 2 (each tone 0.5): inputs 1.00, 0.11, 0.35, 0.54, −0.50, 0.16, −0.35, −0.82, 0.00, −0.82 (exact −0.8155 at n = 7 and 9); n = 2 by hand 0.15 × 0.35 + 0.70 × 0.11 + 0.15 × 1.00 = 0.28; parts to 3 decimals, from the exact gains 0.97716 and 0.48787: 0.451/−0.172, 0.345/0.000, 0.187/0.172, 0.000/−0.244, −0.187/0.172, −0.345/0.000, −0.451/−0.172, −0.489/0.244 (exact sums 0.279, 0.345, 0.359, −0.244, −0.014, −0.345, −0.624, −0.245); click rule from the unrounded samples: 0.278903, 0.345480, 0.359460, −0.243934, −0.014485, −0.345480, −0.623878, −0.244648. At × 2 the output is 0.558, 0.691, 0.719, −0.488, −0.029, −0.691, −1.248, −0.489: n = 8 asks for −1.25, past −1.
- Ratio after the route: 0.488 ÷ 0.977 = 0.499. Volume × 2: 1.954 and 0.976, ratio 0.50.
- Route plus an exact inverse boost: output equals the input one sample late. With the lab's per-band knobs (95% to 105% accepted), tones can come out up to about 5% bigger, and a real boost's own delays can reshape peaks slightly; the prose says so and relies on headroom.
- Arrow end points (python3, clockwise convention): 1,000 Hz (0.645, −0.645), 0.912, 45°; 2,000 Hz (0, −0.70), 90°; 3,000 Hz (−0.345, −0.345), 0.488, 135°; 4,000 Hz (−0.40, 0), 180°.
- One-sample delay for every tone: the click 0.15, 0.70, 0.15 is symmetric around sample 1.
- One-sample delay: 0.125 ms.

Next bug: a hearing clinic plays a 5,000 Hz test whistle and patients hear a clean 3,000 Hz (lesson 4: a dot turning more than half a turn per sample).

Assumptions:
- Lesson 1 defines sample, uses tone and Hz informally, and its bug is clipping (samples past the line's range cut off flat). The prose avoids "gain stage" so "gain" has one meaning.
- Lesson 2 taught convolution both as "a sum of shifted, scaled copies of the impulse response" and as "each output sample is a weighted sum of recent input samples".
- The derivation uses real trigonometry (the cosine difference identity, stated not proved) instead of complex exponentials, since Euler's formula arrives in lesson 6; H(e^{jω}) is named only.
- The counter-clockwise direction is stated as a choice, so lesson 4 can show that the samples cannot see it.
- The boost box comes from the lab; building it from samples is lessons 6 and 10. The crackle the smoother hid is written out of the story (exchange retired), with the noise trade stated.
- The phone band 300 to 3,400 Hz is stated here and explained in lesson 4 (room for the anti-aliasing filter).
- The route's impulse response is symmetric, so its phase is a pure one-sample delay; unequal delays are left to lesson 8.
