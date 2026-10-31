# The Exchange That Moved

Objective: after this, you can copy an analog prototype into a digital filter with the bilinear transform, predict where each analog frequency lands with f = (8000/π) arctan(πF/8000), and prewarp the cutoff so it lands where you want.

Bug: the old analog exchange (second-order Butterworth low-pass, cutoff 3,400 Hz, passes 71% there) is copied with the textbook recipe; the digital copy's 71% point is at 2,363 Hz, and at 3,400 Hz it passes 10.2% instead of 70.7%. Calls sound dull.
Fix: act 2 of the lab: set the analog prototype's cutoff by prewarping, to 10,607 Hz, so the copy passes 71% at 3,400 Hz.

Key words: analog filter, analog prototype, bilinear transform ("the recipe" survives only as the plain-word name around it), warping (noun), the squeeze (the plain-word picture of warping), prewarp / prewarping, the ruler (analog frequencies), the half circle (digital tones), cutoff (for this filter: where it passes 71%), F for analog frequency, f for digital tone, passes / removes, gain.

Terms:
- analog filter: a filter that works on the smooth voltage itself, with no samples; it has a response at every frequency in Hz, from 0 to infinity.
- analog prototype: the analog filter you start from, the one whose response you want to copy into a digital filter.
- bilinear transform: a substitution, s = 2 × 8,000 × (1 − z^−1)/(1 + z^−1), that turns an analog filter's formula into a digital filter's, and squeezes all analog frequencies, from 0 to infinity, onto the digital tones from 0 to 4,000 Hz.
- warping: the uneven squeeze of analog frequencies onto digital tones, gentle at the bottom and ever tighter toward 4,000 Hz; F lands on f = (8000/π) arctan(πF/8000).
- prewarping: choosing the prototype's cutoff by running the warping formula backward from the digital tone you want, F = (8000/π) tan(πf/8000).

Also named, not taught as terms: s = j 2πF (the book's letter, one line), Butterworth (a catalog family, flat below the cutoff).

Reused terms: filter, unit circle, zero, pole, stable, H(z) (lesson 6); frequency response, gain, phase (lesson 3); alias (lesson 4); cutoff (lesson 4's switch from keeping to removing, here pinned to "passes 71%" for this filter family), decibels (lesson 10). The wheel is lesson 3's picture, which lesson 6 turned into the unit circle; the prose says they are the same picture and uses the canonical wording.

Misconception: "After prewarping, the copy matches the analog filter everywhere." · Why wrong: prewarping pins one frequency; every other one is still squeezed, so at 3,000 Hz the copy passes 94.8% where the exchange passed 78.9%, and at 4,000 Hz 0% where the exchange passed 59%.

Worked examples:
1. Warping table: analog 0, 500, 1,000, 2,000, 3,000, 3,400, 5,000, 10,000, 20,000, 100,000, 1,000,000 Hz land on 0, 494, 953, 1,695, 2,208, 2,363, 2,800, 3,365, 3,678, 3,935, 3,994 Hz. Check: digital 3,000 Hz comes from analog 6,148 Hz, where the exchange passes 29.2%, the technician's number.
2. Prewarp: F = 2546.5 × tan(1.3352) = 2546.5 × 4.1653 = 10,607 Hz. Coefficients counted out: multiply by (1 + z^−1)^2, collect powers; in billions Ωc² = 4.4415, K² = 0.2560, √2 Ωc K = 1.5080; bottom 6.2055, 8.3711, 3.1895; divide by 6.2055: 0.7157, 1.4315, 0.7157 on the input, feedback 1.3490 and 0.5140. 0 Hz check 2.8629 / 2.8630 = 1.000. Click response (figure only now) 0.7157, 0.4660, −0.2807, 0.1392, −0.0435, −0.0129. Gains 100.0%, 99.8%, 94.8%, 70.7%, 10.7%, 0% at 1,000, 2,000, 3,000, 3,400, 3,800, 4,000 Hz.

Derivation (preceded by a one-paragraph lesson 6 reminder of ω = 2πf/8000, j and the mirror arrow, and the one new idea, Ω = 2πF radians per second against ω radians per sample; step one shows that |H(j2πF)| is the manual's gain formula): analog response as a fraction in s = j2πF; digital as a fraction in z; substitute s = 16000 (1 − z^−1)/(1 + z^−1); on the circle the fraction is j tan(ω/2) (Euler); so 2πF = 16000 tan(ω/2); in hertz F = (8000/π) tan(πf/8000); tan x ≈ x explains the constant 2 × 8,000.

Figures (one per new concept or step that needs a picture, in prose order; the prose says what each shows just before its slot; every animated figure ends on a still that carries the whole idea under reduced motion):
- [[diagram:overlay-bug]] (the bug): the technician's two rows as two gain curves from 0 to 4,000 Hz, exchange solid and script's copy dashed, a horizontal line at 71%, crossings marked at 3,400 and 2,363 Hz; the gap widens to the right, so the reader sees a squeeze, not a slide. Still.
- [[diagram:analog]] (analog filter): top, a smooth voltage through a box of capacitors and coils; bottom, lesson 4's dots, 8,000 a second, into a digital filter; under each its frequency axis, the digital one stopping at 4,000 Hz, the analog one running off the page with an arrow. Animates: the voltage flows continuously while the samples tick. Still: both rows with their axes.
- [[diagram:prototype]] (analog prototype): the exchange's gain curve from 0 to 10,000 Hz, the table's points dotted on it, 71% at 3,400 Hz marked, a dashed wall at 4,000 Hz that the curve passes straight through (42% at 5,000 Hz). Still.
- [[diagram:wrap-vs-squeeze]] (why squeeze, the picture behind the bilinear transform): left, the ruler wrapped around the circle again and again (lesson 4), 5,000 Hz landing on 3,000 Hz; right, the same ruler bent once onto the top half of the unit circle, ticks 0, 1,000, 2,000, 3,400, 5,000, 10,000, 100,000 even near 0 Hz and bunching toward 4,000 Hz, infinity on the far left. Animates: both rulers roll onto their circles at the same pace. Still: both finished, with labeled ticks.
- [[diagram:arctan]] (arctan's shape, before the warping table): y = arctan(x) for x from 0 to 20, the diagonal y = x dashed near the start, a flat ceiling at π/2 (90°) labeled. Still.
- [[diagram:warping]] (warping): the curve f against F (F 0 to 20,000 Hz, f 0 to 4,000 Hz), the dashed diagonal f = F, the ceiling at 4,000 Hz; read upward: dashed guide from F = 3,400 up to the curve and across to f = 2,363; read backward (the tan direction, introduced in the same section): guide from f = 3,000 across and down to F = 6,148. Still.
- [[diagram:arrows]] (lesson 6 reminder, arrow and mirror, used in derivation step three): an arrow at angle θ and its mirror at −θ turning in opposite directions; their sum drawn as a flat arrow of length 2 cos θ, their difference as an upright arrow 2j sin θ. Animates: θ sweeps, sum and difference slide along their lines. Still: one angle (θ = 50°) with all four arrows labeled.
- [[diagram:two-radians]] (Ω against ω): two axes side by side: ω in radians per sample from 0 to π (0 to 4,000 Hz) ending in a wall, Ω in radians per second from 0 to infinity (0 Hz upward) with an arrow; 3,400 Hz marked on both (ω = 0.85π, Ω = 21,363 rad/s). Still.
- [[diagram:s-line]] (H(s) is the gain formula): the analog ruler drawn as the vertical line s = j2πF; a dot climbs it while a gauge beside reads |H(s)|, tracing the curve 1/√(1 + (F/3400)^4); the bottom of H at u = 1 shown as the arrow (1 − u²) + j√2 u = j√2. Animates: the dot climbs and the curve draws. Still: the line, the finished curve, F = 3,400 at 71%.
- [[diagram:bilinear]] (the bilinear transform as a machine): the manual's H(s) goes into a box labeled with the substitution, out comes the five-coefficient program drawn as a delay line with two input taps forward and a two-step feedback path. Animates: s is replaced and the fraction reshapes. Still: formula, box, program.
- [[diagram:zplane]] (bonuses: zero at 4,000 Hz and stability): lesson 6's unit circle with the script's filter, a double zero at z = −1 and a pole pair at radius 0.44 (angle 112.5°); a tone dot sweeps the top half from 0 to 4,000 Hz while a small gauge shows the gain. Animates: the sweep. Still: the circle with zeros, poles and the dot at 2,363 Hz reading 71%.
- [[diagram:prewarp]] (prewarping): the warping curve read backward: dashed guide from f = 3,400 across to the curve and down to F = 10,607. Animates: the guide traces. Still: the guide drawn.
- [[diagram:echo]] (the prewarped filter's click response and poles; replaces the prose's former impulse table): stems of y[n] for n = 0 to 9 (0.7157, 0.4660, −0.2807, 0.1392, −0.0435, −0.0129, 0.0397, −0.0470, 0.0430, −0.0338, full precision), alternating and dying; beside it the unit circle with the old poles (radius 0.44) faded and the new ones (radius 0.72, angle 160.2°, near 3,560 Hz) solid. Still.
- [[diagram:squeezed-prototype]] (why the prewarped copy is flatter): the 10,607 Hz prototype's gain curve from 0 to 20,000 Hz on the ruler, its 0 to 10,607 Hz stretch highlighted, squeezed onto the digital axis 0 to 4,000 Hz where that stretch fills 0 to 3,400 Hz. Animates: the ruler compresses. Still: both axes with the highlighted stretch linked.
- [[diagram:overlay]] (the misconception): three gain curves (plus an optional fourth, the pin-3,000 copy, dash-dot, crossing 71% at 3,108 Hz and passing 40% at 3,400 Hz), 0 to 4,000 Hz: exchange (solid), script's copy (dashed), prewarped copy (dotted); the 71% line crossed by exchange and prewarped copy at 3,400, by the script's copy at 2,363; the gaps at 3,000 Hz (78.9% against 94.8%) and 4,000 Hz (59% against 0%) annotated. Still.

Lab:
- [[lab]] act 1, explore: a draggable mark on the analog ruler (0 to 100,000 Hz, logarithmic scale) and the half circle; the mark's landing point and its digital f shown live; below, the exchange's gain curve and the copy's gain curve over 0 to 4,000 Hz, the dragged frequency highlighted on both. A play button for the tone at f through both filters. Prediction before dragging: "Where does 3,400 Hz land? Where does 10,000 Hz land?" Most guess near 3,400 and "off the circle"; the lab shows 2,363 and 3,365.
- [[lab-act2]] act 2, fix: one knob, the prototype's cutoff (1,000 to 20,000 Hz). The technician's meter shows the copy's gain at 3,400 Hz; target 70.7% within one percentage point; a marker shows where the copy's 71% point sits against the exchange's 3,400 Hz. Prediction before the knob unlocks: "Above or below 3,400 Hz? By how much?" Answer 10,607 Hz. After success, an optional check prompts the misconception: compare 3,000 Hz (94.8% against 78.9%).

Numbers (computed in python3 with math and cmath, no numpy available; fs = 8,000; prototype H(s) = Ωc²/(s² + √2 Ωc s + Ωc²); bilinear with constant 2 fs):
- Exchange gains 1/√(1 + (F/3400)^4): 1,000 Hz 0.996; 2,000 0.945; 3,000 0.789; 3,400 0.707; 3,800 0.625; 4,000 0.586; 5,000 0.420; 6,148 0.292; 10,000 0.115.
- Unwarped copy (Ωc = 2π·3400): b = 0.3817, 0.7633, 0.3817; a1 = 0.3351, a2 = 0.1915; poles radius 0.438 at 112.5° (about 2,500 Hz). Gains: 1,000 Hz 0.995, 2,000 0.872, 3,000 0.293, 3,400 0.102, 3,800 0.011, 4,000 0. 71% point 2,363.0 Hz (bisection).
- Warping f(F): 500 to 493.7 (−6), 1,000 to 952.9 (−47), 2,000 to 1,695.4 (−305), 3,000 to 2,207.8 (−792), 3,400 to 2,363.0 (−1,037), 5,000 to 2,800.5, 10,000 to 3,365.0, 20,000 to 3,677.5, 100,000 to 3,935.2, 1,000,000 to 3,993.5; 10,000 to 1,000,000 spans 628.5 Hz. Backward F(f): 500 from 506.5, 1,000 from 1,054.8, 2,000 from 2,546.5, 3,000 from 6,147.7, 3,400 from 10,606.8, 3,800 from 32,356.
- 8000/π = 2546.48; π·3400/8000 = 1.3352; tan = 4.1653; F = 10,606.8; ratio to 3,400 is 3.12.
- Prewarped copy (Ωc = 2π·10,606.8): b = 0.7157, 1.4315, 0.7157; a1 = 1.3490, a2 = 0.5140; poles radius 0.717 at 160.2°. Gains: 1,000 Hz 1.000, 2,000 0.998, 3,000 0.948, 3,400 0.7071, 3,800 0.107, 4,000 0. 71% point 3,400.0 Hz. Full-precision click response 0.7157, 0.4660, −0.2807, 0.1392, −0.0435, −0.0129; the prose table uses the rounded coefficients (0.4660, −0.2808, 0.1393, −0.0436, −0.0128).
- 71% is −3.0 dB.
- Reverse lookup check: π·3000/8000 = 1.1781, tan = 2.4142, × 2546.48 = 6,147.7.
- H(s) to gain: with u = F/3400, bottom Ωc²[(1 − u²) + j√2 u], length squared 1 + u⁴.
- Warp shifts: 5,000 −2,200; 10,000 −6,635; 20,000 −16,322; 100,000 −96,065; 1,000,000 −996,006.
- Ωc for 3,400 Hz: 21,362.8 rad/s.
- Coefficient build (prewarped): Ωc = 66,644.8; Ωc² = 4.44153e9; K² = 2.56e8; √2 Ωc K = 1.50800e9; A = 6.20553e9, B = 8.37106e9, C = 3.18953e9.
- Exchange gain at 6,147.7 Hz: 0.29249, so the copy's 3,000 Hz value is 29.2% (unwarped copy at 3,000 Hz also 0.2925 directly). 5,000 Hz lands on 2,800.46 Hz.
- Compromise: largest gap between the prewarped copy and the exchange below 3,400 Hz is 1.596 dB at 3,026 Hz (prose: 1.6 dB near 3,030 Hz; 0.48 dB at 2,000 Hz). Pinning 3,000 Hz instead needs F/cutoff = 3,000/3,400 at F = 6,147.7, so cutoff 6,147.7 × 3,400 / 3,000 = 6,967.4 Hz; its 71% point lands at 3,108 Hz and it passes 39.6% at 3,400 Hz.
- Prewarped pole angle 160.2° is about 3,560 Hz; negative real part explains the alternating echo.

Next bug: the line must tell which keypad key was pressed from its two tones (DTMF, lesson 12).

Assumptions:
- The learner has never seen analog filters, Laplace or the s-plane. Only s = j2πF on the frequency axis is used; the stability mapping is stated as a fact the book proves, checked by pole radius, and analog poles are never mentioned.
- Order is defined in plain words (the count of energy-storing capacitors and coils, the highest power of s); double zero is two zeros on one point; a stable analog filter is one whose ringing dies out, and the bilinear transform preserving stability is taken on trust from the book.
- Taken on trust from circuit theory and said so in the prose: a capacitor's current is proportional to j2πF times its voltage, so any RLC circuit's response is a fraction in j2πF.
- The exchange filter is a second-order Butterworth at 3,400 Hz, chosen because 3,400 Hz is the classic telephone band edge and its gain formula is one line.
- Why pin the cutoff: argued in the prose (it defines the filter, it is what is measured, below it the gap is at most 1.6 dB, pinning 3,000 Hz instead costs the cutoff). A prototype matched everywhere is left out.
- Impulse invariance is not taught; its failure is shown as lesson 4's wrapping, to motivate the squeeze.
- "Cutoff" was defined in lesson 10 as the tone where a low-pass switches from passing to removing; for this filter family the manual's cutoff is where it passes 71%, stated in the prose.
- The derivation uses the book's constant 2/T = 2 × 8,000; the book's own development (first edition, chapter 7) uses the same substitution with T the sampling period.
