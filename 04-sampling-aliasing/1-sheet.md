# The Whistle That Changed Its Mind

Objective: after this, you can predict which tone the phone stores for any true tone at 8,000 samples per second (fold at the limit), explain with the wheel why a tone above the limit gives the same samples as a lower one, and say why the fix must come before sampling.

Bug: a hearing clinic plays a 5,000 Hz test whistle down the line; patients hear a clean, steady 3,000 Hz, so a patient who cannot hear 5,000 Hz still answers "yes".
Fix: act 2 of the lab: put a filter before the sampler (after it fails, as the learner sees). The lab's filter is the filter-first figure's: 100% up to 600 Hz below its cutoff (the half-gain point), falling in a straight line to 0 at 600 Hz above it. A cutoff from about 3,880 to 4,010 Hz (3,900 to 4,000 Hz on the 50 Hz slider) keeps the voice and folds anything that leaks through above 3,400 Hz, so every alias is out of the voice band.

Key words: cinema wheel (not "wagon wheel"), cutoff, squeal (not "hiss": one pitch, not broadband), the true tone (not "the analog signal", "the input"), stores (not "records", "captures", "keeps" as a term), sample (verb and noun; not "measure" as a term, "measurement" only in the definition), sampling rate (not "sample rate", "frequency of sampling"), the limit (not "Nyquist frequency"; the book's name may be mentioned once at most, and it isn't in the prose), alias (not "ghost", "image"; "ghost" and "image" belong to lesson 5), fold (not "mirror" as a verb for the rule; "mirrored" only for the wheel's top-bottom reflection), the wheel and the dot, turns, the whistle, the squeal, filter first.

Terms (glossary wording, unchanged; "sample" is lesson 1's term, reused, not new here):
- the true tone: the sound that went into the phone, before sampling.
- sampling rate: the number of samples in one second, here 8,000.
- stores: what the phone keeps after sampling.
- the limit: half the sampling rate, here 4,000 Hz; tones safely below it are stored truthfully. The limit itself is a knife edge. (New glossary wording, replacing "the fastest tone the line can store".)
- alias: a lower, false tone that gives the same samples as a higher, true one.
- cutoff (small extra term, not in the table): the tone where a filter switches from keeping to removing, with no exact level (lessons 10 and 11 each pin it for their filters). The prose's filter reaches about 0% by 4,600 Hz.

Reused from earlier lessons: sample (lesson 1), tone as a wheel (lesson 3, canonical wording recapped once, in worked example 1), frequency response and gain (lesson 3, for the filter in front of the sampler), linear, time-invariant (lessons 1 and 3, to rule out the boost as the cause), system.

Misconception: "Sampling too slowly loses detail, so the whistle comes through blurry, rough or quieter." Why wrong: too few samples make a different, perfectly clean tone, because the alias's samples are exactly the samples of a real lower tone.

Worked examples:
1. Samples n = 0..8 of 1,000 Hz (1, 0.71, 0, −0.71, −1, ...), 5,000 Hz and 3,000 Hz (both 1, −0.71, 0, 0.71, −1, 0.71, 0, −0.71, 1): the last two lists are identical.
2. 4,600 Hz (207°) and 3,400 Hz (153°) give the same awkward list 1, −0.89, 0.59, −0.16, −0.31, 0.71, −0.95, 0.99, −0.81; then 8,000 Hz gives 1, 1, 1, ... (0 Hz); 9,000 Hz stores 1,000 Hz; 13,000 Hz stores 3,000 Hz. Edge: 4,000 Hz reads anything from a full flip (1, −1, ...) to all zeros, depending on timing.

Derivation: x[n] = x_c(nT), T = 1/8000; cos(2π f n T) = cos(ωn), ω = 2π f / 8000; take a whole turn off: cos((ω − 2π)n) = cos(ωn), so f and f − 8,000 match; cos(−ωn) = cos(ωn); 5π/4 → −3π/4 → 3π/4 → 3,000 Hz. Stored tone = distance from f to the nearest multiple of 8,000. Sampling theorem stated in words only (Ω symbols and the spectrum-copies picture removed; copies belong to lesson 5's images).

Figures (every new idea gets its own slot where the prose first needs it; each animation has a final frame that reads alone as a still under reduced motion):
- [[diagram:sampler]] (the true tone, sampling rate, stores; recalls sample): a smooth 1,000 Hz wave with sample dots every 125 µs, the gaps between samples greyed as "the phone looks away", and the stored list written beneath. Animates: a playhead sweeps and drops one dot per sample, the number appearing in the list. Still: all dots and the full list.
- [[diagram:same-dots]] (worked example 1): the 5,000 Hz and 3,000 Hz waves drawn on the same axes, both threading the same nine dots. Animates: the 3,000 Hz wave draws first, then the 5,000 Hz wave draws through the same dots, which pulse when hit. Still: both waves, dots marked. Learner predicts: which wave the far end will play.
- [[diagram:wheel]] (one-hop mirror argument): two wheels side by side, 5,000 Hz landing at 225° (lower left) and 3,000 Hz at 135° (upper left), the horizontal line through the center dashed, a drop line from each dot to the same left-right reading. Animates: the whistle's dot overshoots half a turn while the 3,000 Hz dot turns its 135°, both landing on mirror spots. Still: both dots, the dashed line, matching readings. Optional second panel, the backwards view: lesson 3's wheel (same drawing as 06-zeros-and-poles/2-diagram-wheel.html). A 225° counter-clockwise arc and a 135° clockwise arc both ending on the same lower-left spot. Animates: the dot overshoots half a turn on the 225° arc; then, shown one stop per sample, the same stops replay as a dot creeping 135° backwards. Still: both arcs with a shared end point and the label 360° − 225° = 135°.
- [[diagram:cinema]] (the cinema wheel): a one-spoke car wheel in successive film frames, 345° per frame. Animates: true motion (fast forwards) faded, the sampled frames (15° backwards each). Still: a row of five frames with the spoke stepping back 15°.
- [[diagram:mirror]] (every sample stays mirrored): the 5,000 Hz dot (n × 225°, which is n × 135° below the right) and the 3,000 Hz dot (n × 135° above) stepping together for 8 samples, mirror spots across the dashed horizontal line, the two readings written side by side and matching. Animates the stepping. Still: all eight stop pairs and the matching list.
- [[diagram:turn-round]] (the limit): stored tone against true tone, 0 to 8,000 Hz: a tent rising to 4,000 and falling to 0 at 8,000, with the lab's points (4,500 → 3,500, 7,000 → 1,000, 8,000 → 0). Static. Placed right after the lab so readers who skip it see the turn.
- [[diagram:fold]] (the limit, alias): a strip of true tones 0 to 8,000 Hz folded at 4,000 Hz; 5,000 lands on 3,000, 4,600 on 3,400, 7,000 on 1,000, 8,000 on 0. Animates: the paper folds. Still: folded strip with arrows. Learner predicts: where 6,000 Hz lands (2,000).
- [[diagram:zigzag]] (past the fold): stored tone against true tone from 0 to 16,000 Hz, a zigzag between 0 and 4,000 with 5,000, 9,000 and 13,000 marked. Static.
- [[diagram:knife-edge]] (a tone right at the limit): a 4,000 Hz wave sampled at its peaks (1, −1, ...) beside the same wave sampled at its middle crossings (0, 0, ...), plus one in-between case. Animates: the sample times slide by a quarter cycle and the stored flip shrinks to nothing. Still: the three panels.
- [[diagram:full-lap]] (derivation step three): a wheel with the extra full turn per sample drawn as a ghost loop, the dot ending where it would have without it. Animates: the dot runs the ghost lap between two looks. Still: the loop and both end positions coinciding.
- [[diagram:voice-aliases]] (Your turn): a strip from 0 to 4,000 Hz with the voice, up to 3,400 Hz, shaded and the two aliases drawn as spikes inside it at 3,000 (whistle) and 3,400 (squeal), faint arrows folding down from 5,000 and 4,600. Static. The key picture for why filtering after sampling fails.
- [[diagram:filter-first]] (filter first, cutoff): the chain microphone, filter, sampler, stores, with the filter's gain curve above it: 100% to 3,400 Hz, falling across 3,400 to 4,600 (labelled "room to fall"), about 0% from 4,600 Hz on, the cutoff marked on the slope; the whistle and squeal marked as removed. A ghosted second chain with the filter after the sampler shows the aliases already inside the voice. Static.

Lab:
- [[lab]] act 1, explore: true tone slider 0 to 8,000 Hz; a wheel showing the dot's stop after each sample (with a faint trail of the true dot between samples), the sample dots under the true wave, a meter for the stored tone, and play buttons for the true tone and the stored tone. Predict first: 4,500 Hz (stores 3,500), 7,000 Hz (stores 1,000), 7,800 Hz (stores 200, a low hum; 8,000 Hz would be given away by the turn table above the lab). The learner should see the stored tone rise to 4,000 then fall.
- [[lab-act2]] act 2, fix: an incoming call of voice (tones up to 3,400 Hz) plus the 5,000 Hz whistle plus a 4,600 Hz squeal. The learner first predicts where a 4,900 Hz squeal, a number the prose never computes, would be stored (3,100 Hz); the call to fix keeps the 4,600 Hz squeal. A filter block can be dropped after or before the sampler, with a cutoff slider. The prose no longer announces that "after" fails; it states the result after the lab slot. After the sampler: the aliases sit at 3,000 and 3,400 Hz, inside the voice, so no cutoff removes them without cutting the voice. Before the sampler: pass when the voice keeps at least 90% of every tone up to 3,400 Hz and every tone that leaks through folds above 3,400 Hz, so every alias is out of the voice band; with the sloped filter that means a cutoff from about 3,880 to 4,010 Hz, 3,900 to 4,000 Hz on the 50 Hz slider (range 1,000 to 6,000 Hz).

Numbers (computed with python3, math module):
- 1 ÷ 8,000 s = 125 µs between samples; a 5,000 Hz tone completes 0.625 of a cycle between samples (225°).
- Turn per sample: 1,000 Hz 45°, 3,000 Hz 135°, 4,000 Hz 180°, 5,000 Hz 225°, 7,000 Hz 315°, 8,000 Hz 360°, 9,000 Hz 405°, 13,000 Hz 585°.
- Stored tones: 4,500 → 3,500; 4,600 → 3,400; 5,000 → 3,000; 6,000 → 2,000; 7,000 → 1,000; 8,000 → 0; 9,000 → 1,000; 13,000 → 3,000.
- Largest difference between the 5,000 Hz and 3,000 Hz sample lists over 10,000 samples: 1.0e−11 (rounding); 7,000 vs 1,000 Hz 1.2e−11; 4,600 vs 3,400 Hz 1.2e−11.
- 4,600 Hz turns 207°, 360° − 207° = 153° = 3,400 Hz.
- 4,000 Hz with timing offsets 0°, 30°, 60°, 90°: flips of size 1, 0.87, 0.5, 0.
- 135° counter-clockwise lands at (−0.71, +0.71), 135° clockwise and 225° counter-clockwise at (−0.71, −0.71): same left-right reading.
- 4,000 Hz as a sine: sin(πn) = 0 for every n.
- Film: 23 turns per second at 24 pictures per second is 345° per picture, 15° short: one turn backwards per second.
- At 16,000 samples per second: limit 8,000 Hz, 5,000 Hz turns 112.5° per sample and is stored as 5,000.
- Derivation: 5π/4 − 2π = −3π/4; 3π/4 ÷ 2π × 8,000 = 3,000 Hz.

Next bug: joining a 16,000 samples per second wideband line puts a ghost copy of every voice above 4,000 Hz (lesson 5: upsampling's images).

Assumptions:
- "sample" is lesson 1's term; this lesson recalls it and does not define it. The glossary entry should cite lesson 1.
- "the limit" now uses the new wording; series.md's glossary entry needs the same change.
- The far end's playback rule ("play the tone below the limit") stands for ideal band-limited reconstruction; sinc interpolation is not needed for the objective.
- The anti-aliasing filter is described by its frequency response (lesson 3) and treated as an analog box in front of the sampler; how to design one is lessons 10 and 11.
- The clinic story replaces the old "whistle" framing but keeps the table's numbers: a 5,000 Hz whistle stored and heard as 3,000 Hz.
- The old 1-text.md and other files in this folder were left untouched.
