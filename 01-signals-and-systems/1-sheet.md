# The Buzz on Loud Calls

Objective: after this, you can test with numbers whether a system is linear and whether it is time-invariant, explain why a linear, time-invariant system never adds a tone that was not in its input while clipping does, and size a booster for the loudest total input with headroom.

Bug: loud callers come out with a harsh buzz, quiet callers are fine. The booster multiplies by 4, and the chip stores each sample as a 16-bit whole number standing for −1 to +1, so it clips anything outside that range. A loud caller (size 0.5) is clipped; a quiet one (size 0.2) is not.
Fix: act 2 of the lab: turn the booster down so the loudest input it ever sees (0.5, recorded on test calls, speakerphones included) lands at 0.8: ×1.6. ×2 would land exactly on the edge with no margin; ×1.6 lets a caller reach 0.625 before clipping. The buzz meter reads 0% for the loud caller, the quiet caller and the speakerphone pair.

Key words: signal (not "waveform", "stream"), system (not "filter", "block", "processor"; "filter" waits for lesson 6), sample, tone (not "frequency component", "note", "harmonic"), pitch, size (of a tone; not "amplitude", "gain"), the booster (not "gain stage", "amplifier"; "gain" is lesson 3's term), clipping / clip (not "saturation"), the range (−1 to +1), the edge, headroom, the buzz, linear, time-invariant, LTI, neighbor rule, speakerphone.

Fixed wording, used in every place it comes up: "The real booster is not linear. It only behaves like the linear ×4 while its outputs stay inside the range."

Terms:
- sample: one measurement of the sound at one moment (glossary wording from lesson 4, introduced only as far as "a call is a list of numbers").
- signal: a list of numbers, one per moment. A call is a signal.
- system: a rule that takes in one signal and gives back another.
- linear: doubling the input doubles the output, and two inputs added give their outputs added. (It must hold for every input, sums included.)
- time-invariant: delaying the input only delays the output; the rule works the same at every moment. (The shift n0 may be negative, so it covers advances too.)
- Helper words, not glossary terms:
  - tone: a steady wave that repeats at a fixed rate. Its samples are cos of an angle stepping 360° × tone ÷ 8,000 per sample.
  - pitch: how high a tone sounds, set by its rate in Hz.
  - size: the number a tone's samples are multiplied by.
  - clipping: flattening any value outside −1 to +1 to the edge.
  - square wave: flat on top and on the bottom.
  - neighbor rule: x[n+1] + x[n−1] = c·x[n], c = 2 cos ω0.
  - LTI: linear and time-invariant.
  - start angle φ: where in its cycle a tone starts. The word "phase" is left to lesson 3.
  - headroom: the part of the range left free above the loudest input you have measured.

Misconception (folded into the speakerphone example, no separate section): "The booster passed every caller I tried, one by one, so it's linear." Why wrong: linearity is a promise about sums; two voices that each pass cleanly add past the edge and buzz (1.60 predicted, 1.00 written).

Worked examples:
1. Booster on a 1,000 Hz tone.
   - Quiet (0.2): ×4 gives 0.80, 0.57, 0, −0.57, ..., nothing clips, clean tone.
   - Loud (0.5): ×4 gives 2.00, 1.41, 0, ..., clipped to 1, 1, 0, −1, −1, −1, 0, 1.
   - Neighbor rule table: the clean tone passes at n = 1 and 4; the clipped list fails (1 vs 1.414, −2 vs −1.414), so it is "not a pure 1,000 Hz tone".
   - Decomposition: 1.207 cos(45°n) − 0.207 cos(135°n), checked at n = 0 and 1 in a table.
2. Four systems tested.
   - Booster on a speakerphone (two 0.2 voices, 1,000 Hz and 500 Hz): 1.60 predicted vs 1.00 at n = 0, not linear.
   - Smoother (x[n] + x[n−1]) / 2 on 1,000 Hz: 0.85, 0.35, −0.35, −0.85, ... The n = 0 cell is blank because input[−1] does not exist. The neighbor rule holds at every n. Drawn as a smooth wave through the dots, the output peaks at 0.92 halfway between two dots, half a sample after the input.
   - Fader min(n / 8.0, 1) · x[n]: linear, not time-invariant; the neighbor rule fails at n = 1 (0 vs 0.13).
   - Add 0.1: silence in gives 0.1 out, so not linear; the constant lift is a 0 Hz tone nobody said.

Derivation (tone imagined playing forever; the first output samples of a real call can differ):
1. The tone obeys x[n+1] + x[n−1] = c x[n].
2. w = x[n+1] + x[n−1] − c x[n] is silence.
3. Time-invariance with n0 = −1 and n0 = 1 (the substitution x[n − (−1)] = x[n+1] is shown) maps the shifted tones to shifted outputs.
4. Linearity maps w to y[n+1] + y[n−1] − c y[n].
5. Silence in gives silence out, so y obeys the same rule.
6. Two starting numbers fix the list (a domino table from the smoother's 0.854, 0.354). The two knobs of A cos(ω0 n + φ) can hit any two starting numbers: this is taken on trust ("lesson 3's picture shows why") with one worked case (A = 0.924, φ = −22.5°).
- 0 Hz and 4,000 Hz are set aside and the reason is stated: there, sliding the start only changes the size (cos φ, or cos φ · (−1)^n), so the knobs act as one.

Figures. A figure animates only where a process or motion is the idea. Under reduced motion each one shows its final frame, which must read on its own as a still. The prose says what to look at before or beside every slot.
- [[diagram:samples]] (animates): a smooth voltage line; vertical sticks appear every 1/8,000 s; the curve fades and only the dots remain, each labelled with its value and x[n]. Still frame: the faint curve with the labelled dots on it. The picture "samples are dots on a smooth wave" is reused by the smoother figure.
- [[diagram:tone-steps]] (animates): a cosine curve drawn against angle (0° to 360°), a marker stepping 45° at a time, and at each step a dot dropping onto a stem plot beside it (1.00, 0.71, 0.00, ...). Still frame: all nine stems with their angles. No wheel or circle; the wheel is lesson 3's picture.
- [[diagram:system]] (still): a signal (a row of dots) going into a box labelled T, another signal coming out, with y[n] = T{x[n]}. Under the box, three example rules: ×4, average with the one before, wait 2,000 samples.
- [[diagram:clip]] (animates): quiet and loud 1,000 Hz tones as stem plots at the same scale, with the band −1 to +1 shaded and labelled "what the 16-bit chip can store". Both grow ×4; the loud one's stems cross the edge and are pushed back onto it (2.0 to 1.0, 1.41 to 1.0). Still frame: the quiet one inside the band, the loud one's ×4 stems drawn faintly past the band with the clipped stems on the edges. The learner predicts which caller survives.
- [[diagram:neighbor-rule]] (still): three adjacent stems, the outer two stacked end to end beside the middle one scaled by 1.414. Left, the clean tone at n = 1 matches (check mark). Right, the clipped list at n = 1 gives 1 against 1.414 (cross).
- [[diagram:two-tones]] (animates): a 1,000 Hz wave of size 1.207 and a 3,000 Hz wave of size 0.207, drawn faintly. The small one is subtracted from the big one until the result lands exactly on all eight clipped stems 1, 1, 0, −1, −1, −1, 0, 1. Still frame: both faint waves, the difference through the clipped stems, and the 3,000 Hz wave labelled "the buzz".
- [[diagram:superposition]] (still): two paths, scale-and-add then T, against T then scale-and-add. With the booster and two samples of 0.1, both paths give 0.8 (match). With two samples of 0.2, T first then add gives 1.6, but add first then T gives 1.0 (no match).
- [[diagram:time-invariance]] (still): a blip into the booster and its output; below, the same blip shifted three samples later, with its output shifted by exactly three and otherwise unchanged.
- [[diagram:speakerphone]] (animates): two quiet voices (0.2 each, 1,000 Hz and 500 Hz) boosted ×4, each inside the band with a green check. They slide together and add, and the sum pokes out of the band and is cut flat at n = 0 and 1 (red cross). A small margin strip shows a row of green checks for single callers next to one red cross for the sum. Still frame: the two boosted voices small on the left, the clipped sum on the right, and the strip.
- [[diagram:smoother]] (still): the input's smooth wave and dots, and the output's smooth wave and dots, overlaid. The output's top (0.92) is marked halfway between two dots, and the half-sample shift between the two waves' peaks is marked. The n = 0 output position is shown empty with "needs input[−1]".
- [[diagram:fader]] (still): a ramp from 0 to 1 over the first 8 samples, multiplying the tone; beside it, one blip early and one blip later through the fader, with the later one coming out bigger, labelled "not time-invariant".
- [[diagram:constant]] (still): the tone, and the tone lifted 0.1 off the zero line, with the gap between the zero line and the new centre line labelled "0 Hz tone, nobody said it".
- [[diagram:proof]] (still): three copies of the tone (one sample earlier, one sample later, scaled by −c) summing to a flat zero line; an arrow through T; three copies of y summing to zero. The shift arrows are labelled "time-invariance" and the summing arrow "linearity". Badges mark where the booster and the fader each break the chain.
- [[diagram:chain]] (animates): two seed dots (0.854, 0.354); each new dot is built from the two before it by c × latest − one before, like falling dominoes, giving −0.354, −0.854, −0.854, ... Still frame: the seeds and the built row, with each built dot linked back to its two parents.
- [[diagram:size-and-start]] (animates): two given dots (0.854 at n = 1, 0.354 at n = 2). A 1,000 Hz wave with a size knob and a start knob grows and slides until it passes through both, stopping at size 0.924, start −22.5°. Still frame: the fitted wave, both knob values, and the dots on it.
- [[diagram:buzz-bars]] (still): bar charts of tone size against pitch, 0 to 4,000 Hz.
  - Top: the clean 500 Hz voice, one bar.
  - Middle: the clipped 500 Hz voice, bars at 500 (1.212), 1,500 (0.266), 2,500 (0.059) and 3,500 (0.005).
  - Bottom: 1,000 Hz and 1,500 Hz clipped together, with the new bars at 500 (0.085), 2,000 (0.125) and 3,500 (0.165) highlighted between and above the voice's own bars.
- [[diagram:tangled]] (still): two identical 1,500 Hz bars, one labelled "said by the caller" and one "made by clipping", with an equals sign between them.
- [[diagram:fix]] (still): three columns (loud caller, quiet caller, speakerphone pair) at ×4, ×2 and ×1.6, each with the ±1 band.
  - At ×4: the loud caller and the pair cross the band.
  - At ×2: the loud caller sits exactly on the edge, labelled "no margin".
  - At ×1.6: the loud caller peaks at 0.8, the pair at 0.64 and the quiet caller at 0.32. The free strip from 0.8 to 1 is labelled "headroom".

Lab:
- [[lab]] act 1, explore. Controls and readouts:
  - a caller-size slider (0 to 0.5), with the booster fixed at ×4;
  - a tone choice: 500 Hz, 1,000 Hz, or a recorded voice;
  - a sample plot with the ±1 range shaded;
  - a neighbor-rule check that marks each sample with a tick or a cross;
  - the buzz meter: the size of the tones in the output that were not in the input, compared with the voice.

  Before playing, the learner predicts at which caller size the buzz starts (above 0.25, where 4 × size passes 1). A second panel runs the smoother, the fader and the add-0.1 system on the same tone. For each, the learner predicts whether the buzz meter moves (smoother no; fader yes; add 0.1 yes, as a 0 Hz tone).
- [[lab-act2]] act 2, fix: the loud caller (0.5), the quiet caller (0.2) and the speakerphone pair (two 0.2 voices, peak 0.4), with a booster knob from ×1 to ×4. A marker on the plot shows 0.8.
  - The learner first predicts the setting that lands exactly on the edge (×2), then the setting that keeps the loudest peak at 0.8, a fifth below the edge (×1.6).
  - They set it and check that the buzz meter reads 0% for all three.
  - Done when the loudest input peaks at 0.8 or less, every buzz reading is 0%, and the quiet caller peaks at 0.32.

Next bug: callers hear their own voice come back 0.25 s later (lesson 2, impulse response and convolution).

Checks (computed with python3, standard library; numpy was not importable):
- 1,000 Hz samples: 1.000, 0.707, 0, −0.707, −1.000, −0.707, 0, 0.707, 1.000 (45° per sample); 2 cos 45° = 1.4142.
- Quiet ×4: 0.8, 0.566, 0, −0.566, −0.8, ...; loud ×4: 2.0, 1.414, 0, ...; clipped: 1, 1, 0, −1, −1, −1, 0, 1.
- 8-point DFT of the clipped list: 1,000 Hz size 1.2071, 2,000 Hz 0, 3,000 Hz size 0.2071 (with a minus sign); 0.207 / 1.207 = 0.17, "about a sixth". At n = 0: 1.207 − 0.207 = 1. At n = 1: 0.854 − (−0.146) = 1.
- c = 2 cos ω0: 1,000 Hz 1.4142, 2,000 Hz 0.
- Neighbor rule on the clipped output: n = 1 sum 1 vs 1.414; n = 4 sum −2 vs −1.414.
- Speakerphone:
  - booster on each voice, then added: 1.6, 1.305, 0.566, −0.26;
  - booster on the sum: 1.0, 1.0, 0.566, −0.26;
  - peak of the two 0.2 voices: 0.4.
- Smoother on 1,000 Hz: 0.854, 0.354, −0.354, −0.854, −0.854, −0.354, 0.354, 0.854, 0.854. The neighbor rule holds at every interior n. The output is 0.924 cos(45°n − 22.5°), so it peaks at n = 0.5 (between two dots), half a sample after the input; 0.924 = cos 22.5°.
- Step six chain from 0.854, 0.354: −0.354, −0.854, −0.854.
- Fader min(n / 8, 1) on 1,000 Hz: 0, 0.088, 0, −0.265, −0.5, −0.442, 0, 0.619, 1.0; at n = 1, 0 vs 0.125.
- Add 0.1 on 1,000 Hz: 1.1, 0.807, 0.1, −0.607.
- 500 Hz at 0.5, ×4, clipped, 16-point DFT: 500 Hz 1.212, 1,500 Hz 0.266 (22%), 2,500 Hz 0.059 (4.9%), 3,500 Hz 0.005 (0.4%), even multiples 0.
- 1,000 Hz + 1,500 Hz at 0.25 each (peak 0.5), ×4, clipped, 16-point DFT: 500 Hz 0.085, 1,000 Hz 0.748, 1,500 Hz 0.721, 2,000 Hz 0.125, 2,500 Hz 0.029, 3,500 Hz 0.165, 4,000 Hz 0.13.
- Fix:
  - 0.5 × 2 = 1.0, exactly the edge;
  - 0.8 ÷ 0.5 = 1.6, and 0.5 × 1.6 = 0.8;
  - 1 ÷ 1.6 = 0.625, which is 1.25 times 0.5 ("a quarter louder");
  - quiet caller 0.2 × 1.6 = 0.32; speakerphone pair 0.4 × 1.6 = 0.64.

Assumptions:
- Lesson 1 is the first lesson, so nothing is assumed. "Sample" is introduced with the lesson-4 glossary wording, only as "a call is a list of numbers, 8,000 per second". The 4,000 Hz ceiling is stated and credited to lesson 4, and folding is only named, not explained.
- "Tone" uses the cosine recipe without the wheel, which lesson 3 builds. "360° × tone ÷ 8,000" is kept word for word to match the canonical wheel wording, even though a reader found it variable-like.
- "A voice is a sum of tones" and "two knobs can hit any two starting numbers" are taken on trust and credited to lesson 3.
- The table says "a linear system never adds new tones". Strictly it needs linear and time-invariant (the fader is a linear counterexample), so the lesson teaches the LTI version.
- The table's "gain stage" is called "the booster", because "gain" is a new term of lesson 3.
- The fix is ×1.6, not ×2: the loudest peak sits at 0.8, a fifth below the edge, as headroom. Lesson 2's opening was updated to say ×1.6.
