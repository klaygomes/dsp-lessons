# The Whine on Line Two

Objective: after this, you can design a filter that removes one tone, by placing zeros on the unit circle at the tone's angle and poles just inside beside them, and you can tell whether a filter is stable from where its poles sit.

Bug: calls carry a whine, first at 4,000 Hz (a leaking clock chip), then at 2,000 Hz (the replacement chip).
Fix: act 2 of the lab: drag the zero pair onto a whine at a random frequency, then bring the poles in to keep the voice above 90% without passing radius 1.

Key words: filter (not "system" in prose; "system function" only as the book's name for H(z)), passes (not "lets through" in labels), removes (not "kills", "cancels" only for the sample arithmetic), the whine, the voice, zero, pole, feedback, unit circle, notch, stable.

Terms:
- filter: a rule that builds each output sample from input samples, and maybe from its own earlier outputs.
- unit circle: one point per tone; 0 Hz at the right, 4,000 Hz at the left, 45° per 1,000 Hz at 8,000 samples per second.
- zero: a point where the filter's output is zero; tones on it are removed.
- feedback: the filter reusing its own earlier output samples.
- pole: a point where the response is pushed up; comes from feedback.
- notch: a filter that removes one narrow band of tones and passes the rest.
- stable: every pole strictly inside the unit circle; echoes die out.
- system function H(z): the number a tone z^n is multiplied by when it passes through the filter.

Misconception: "The filter detects the whine and subtracts it." Wrong because a filter treats every tone by its point on the circle, whether a whine is present or not: a sung 2,000 Hz note is removed too.

Worked examples:
1. Two-point average on the 4,000 Hz whine (+1, −1, ...): every average is 0. On 500 Hz: 98% passes.
2. 2,000 Hz whine (1, 0, −1, 0, ...): the average passes 71%; (x[n] + x[n−2]) / 2 gives 0 everywhere (zeros at ±j).

Rule (one rule for every case): multiply the distances to the zeros, divide by the distances to the poles, compare with the same number for 0 Hz.

Numbers (computed): |H| of the average = |cos(ω/2)|; 0 Hz 100%, 1,000 Hz 92%, 2,000 Hz 71%, 3,000 Hz 38%, 4,000 Hz 0%. Zeros only at ±j: 1,500 Hz is 0.39 and 1.96 from the zeros, product 0.77, against 2 for 0 Hz: 38%. Notch y[n] = 0.905 (x[n] + x[n−2]) − 0.81 y[n−2] (0 Hz exactly 100%), poles at ±0.9j: 1,500 Hz 97%, 1,800 Hz 83%, 1,900 Hz 60%; r = 0.98: 1,900 Hz 97%. Echo at r = 0.9: 0.9^50 ≈ 0.5%; r = 1.1: 1.1^50 ≈ 117.

Next bug: every click on the line leaves a faint ring at 2,000 Hz (the poles near the circle ring: impulse response, chapter 5).

Assumptions:
- Chapter 4 (the z-transform) taught through zeros and poles on the unit circle; the region of convergence and the inverse transform wait for later lessons.
- The notch is introduced in chapter 4 here, though the book treats filter design later (chapter 7): it is the natural fix for the story's bug.
- Euler's formula is stated, not derived; a real tone is the horizontal shadow of a spinning arrow, and its mirror arrow explains zero pairs.
